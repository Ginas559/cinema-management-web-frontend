import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { createPaymentRequest } from "../../../services/PaymentService";
import { getServiceOrderById } from "../../../services/ServiceOrderService";
import { createBooking } from "../../../services/BookingService";
import { createBill , AddBillEmployee} from "../../../services/BillService";
import PaymentMethodSelector from "./PaymentMethodSelector";
import "../../../styles/booking-summary.css";

export default function BookingSummary({
    showtimeId,
    selectedSeats,
    selectedServices: selectedServicesProp,
    isCounterBooking = false,
    cashierId = null,
    customerPhone = null,
    // Promotions passed in từ tab Promotion
    selectedEventId = null,
    discountPercent = 0
}) {
    const { user } = useAuth();
    const accountId = user?.accountId || null;
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceOrderId, setServiceOrderId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const loadServiceOrder = async () => {
            if (selectedServicesProp && selectedServicesProp.length > 0) {
                setSelectedServices(selectedServicesProp);

                const orderId = localStorage.getItem("currentServiceOrderId");
                if (orderId) {
                    setServiceOrderId(orderId);
                }
                return;
            }

            const orderId = localStorage.getItem("currentServiceOrderId");
            if (!orderId) return;

            try {
                const orderData = await getServiceOrderById(orderId);
                if (orderData.orderDetails && orderData.orderDetails.length > 0) {
                    const services = orderData.orderDetails.map(detail => ({
                        serviceId: detail.service.serviceId,
                        name: detail.service.name,
                        price: detail.price,
                        quantity: detail.quantity
                    }));

                    setSelectedServices(services);
                    setServiceOrderId(orderId);
                }
            } catch (error) {
                console.error("❌ Failed to load service order:", error);
            }
        };

        loadServiceOrder();
    }, [selectedServicesProp]);

    const totalSeatPrice = useMemo(
        () => selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0),
        [selectedSeats]
    );

    const totalServicePrice = useMemo(
        () => selectedServices.reduce((sum, s) => sum + (s.price * s.quantity || 0), 0),
        [selectedServices]
    );

    const totalAmountUSD = totalSeatPrice + totalServicePrice;
    const totalAmountVND = totalAmountUSD * 23000;

    // Tính sau khuyến mãi (BE vẫn tính lại)
    const safePercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    const finalAmountUSD = useMemo(() => {
        return Math.round(totalAmountUSD * (1 - safePercent / 100) * 100) / 100;
    }, [totalAmountUSD, safePercent]);

    const finalAmountVND = useMemo(() => {
        return Math.round(finalAmountUSD * 23000);
    }, [finalAmountUSD]);

    const normalizePaymentMethod = (m) => {
        if (m === "CASH") return "CASH";
        if (m === "CREDIT") return "CREDIT";
        return "CASH";
    };

    // Counter booking flow
    const handleCounterPayment = async () => {
        setLoading(true);
        setMessage("");

        try {
            const bookingResponse = await createBooking(
                showtimeId,
                null, // customerId = null for counter booking
                selectedSeats.map(s => s.id),
                serviceOrderId,
                true, // isCounterBooking = true
                cashierId,
                customerPhone
            );

            const bookingId = bookingResponse?.bookingId || bookingResponse?.data?.bookingId;
            if (!bookingId) {
                throw new Error("Failed to get booking ID from response");
            }

            const billPayload = {
                bookingId: bookingId,
                paymentMethod: normalizePaymentMethod(paymentMethod),
                totalAmount: finalAmountUSD,
                serviceOrderId: serviceOrderId || null,
                eventId: selectedEventId || null,
                discountPercent: safePercent || null
            };

            const billResponse = await createBill(billPayload);
            const billId = billResponse?.billId || billResponse?.data?.billId;

            // Clear localStorage
            localStorage.removeItem("currentServiceOrderId");
            localStorage.removeItem("currentShowtimeId");
            localStorage.removeItem("selectedSeatIds");

            setMessage(`✅ Đặt vé thành công!\nBooking ID: ${bookingId}\nBill ID: ${billId}\nPhương thức: ${paymentMethod}`);

            if (user.role === 'STAFF') { 
                console.log("🧾 Associating bill with employee:", cashierId);
                console.log("🧾 Bill ID:", billId);
                await AddBillEmployee(billId, cashierId);
            }
            // Redirect sau 3 giây
            setTimeout(() => {
                window.location.href = "/counter-bookings";
            }, 3000);

        } catch (err) {
            console.error("❌ Counter booking error:", err);
            setMessage("❌ Lỗi: " + (err.response?.data?.message || err.message || "Không thể tạo booking"));
        } finally {
            setLoading(false);
        }
    };

    // Online payment (VNPay) flow
    const handleOnlinePayment = async () => {
        setLoading(true);
        setMessage("");

        try {
            const pendingBill = {
                accountId,
                showtimeId,
                totalAmount: finalAmountUSD,
                totalAmountVND: finalAmountVND,
                serviceOrderId: serviceOrderId || null,
                seatIds: selectedSeats.map((s) => s.id),
                paymentMethod: "CREDIT",
                eventId: selectedEventId || null,
                discountPercent: safePercent || null,
                selectedSeats: selectedSeats.map(s => ({
                    id: s.id,
                    row: s.row,
                    col: s.col,
                    price: s.price,
                    type: s.type
                })),
                selectedServices: selectedServices.map(s => ({
                    serviceId: s.serviceId,
                    name: s.name,
                    price: s.price,
                    quantity: s.quantity
                }))
            };

            localStorage.setItem("pendingBill", JSON.stringify(pendingBill));
            localStorage.setItem("currentShowtimeId", showtimeId);
            localStorage.setItem("selectedSeatIds", JSON.stringify(selectedSeats.map(s => s.id)));
            localStorage.setItem("totalAmount", String(finalAmountUSD));
            localStorage.setItem("paymentMethod", "CARD");
            if (serviceOrderId) {
                localStorage.setItem("currentServiceOrderId", serviceOrderId);
            }

            const data = await createPaymentRequest(
                finalAmountVND,
                `Booking-${accountId}-${Date.now()}`
            );

            if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                setMessage("❌ Lỗi khi tạo yêu cầu thanh toán VNPay.");
                localStorage.removeItem("pendingBill");
            }
        } catch (err) {
            console.error("❌ Payment error:", err);
            setMessage("❌ Lỗi kết nối máy chủ!");
            localStorage.removeItem("pendingBill");
        } finally {
            setLoading(false);
        }
    };

    const handlePay = isCounterBooking ? handleCounterPayment : handleOnlinePayment;

    return (
        <div className="booking-summary-container">
            <div className="card shadow booking-summary-card">
                <div className="card-body">
                    <h2 className="text-center mb-4">
                        {isCounterBooking ? "🏪 Counter Booking" : "🎟️ Online Booking"}
                    </h2>

                    {/* Thông tin khách hàng (cho counter booking) */}
                    {isCounterBooking && (
                        <div className="alert alert-info mb-3">
                            <strong>👤 Khách hàng:</strong> {customerPhone || "N/A"}<br />
                            <strong>👨‍💼 Nhân viên:</strong> {cashierId || user?.username || "N/A"}
                        </div>
                    )}

                    {/* Ghế đã chọn */}
                    <section className="booking-section">
                        <h5 className="section-title">💺 Selected Seats</h5>
                        {selectedSeats.length === 0 ? (
                            <p className="text-muted">Chưa chọn ghế nào.</p>
                        ) : (
                            <table className="table table-striped table-bordered text-center">
                                <thead className="table-light">
                                    <tr>
                                        <th>Mã ghế</th>
                                        <th>Loại</th>
                                        <th>Giá $</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSeats.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.row}{s.col}</td>
                                            <td>{s.type}</td>
                                            <td className="text-end">{s.price.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <p className="fw-bold text-end">Tổng ghế: {totalSeatPrice.toLocaleString()} $</p>
                    </section>

                    {/* Dịch vụ đã chọn */}
                    <section className="booking-section">
                        <h5 className="section-title">🍿 Selected Services</h5>
                        {selectedServices.length === 0 ? (
                            <p className="text-muted">Chưa chọn dịch vụ nào.</p>
                        ) : (
                            <table className="table table-striped table-bordered text-center">
                                <thead className="table-light">
                                    <tr>
                                        <th>Tên dịch vụ</th>
                                        <th>Số lượng</th>
                                        <th>Giá $</th>
                                        <th>Tổng $</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedServices.map((s, i) => (
                                        <tr key={i}>
                                            <td>{s.name}</td>
                                            <td>{s.quantity}</td>
                                            <td className="text-end">{s.price.toLocaleString()}</td>
                                            <td className="text-end">{(s.price * s.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <p className="fw-bold text-end">Tổng dịch vụ: {totalServicePrice.toLocaleString()} $</p>
                    </section>

                    {/* Tổng cộng (hiển thị sau ưu đãi nếu có) */}
                    <div className="border-top pt-3">
                        {safePercent > 0 ? (
                            <>
                                <h6 className="text-end text-muted">
                                    Tạm tính: {totalAmountUSD.toLocaleString()} $ ({totalAmountVND.toLocaleString()} VND)
                                </h6>
                                <h5 className="text-end fw-bold text-primary">
                                    💵 Sau ưu đãi: {finalAmountUSD.toLocaleString()} $
                                </h5>
                                <h5 className="text-end fw-bold text-success">
                                    💰 Sau ưu đãi (VND): {finalAmountVND.toLocaleString()} VND
                                </h5>
                            </>
                        ) : (
                            <>
                                <h5 className="text-end fw-bold text-primary">
                                    💵 Tổng $: {totalAmountUSD.toLocaleString()} $
                                </h5>
                                <h5 className="text-end fw-bold text-success">
                                    💰 Tổng VND: {totalAmountVND.toLocaleString()} VND
                                </h5>
                            </>
                        )}
                    </div>

                    {/* Phương thức thanh toán (chỉ cho counter booking) */}
                    {isCounterBooking && (
                        <section className="booking-section">
                            <PaymentMethodSelector
                                onSelectPaymentMethod={setPaymentMethod}
                                disabled={loading}
                            />
                        </section>
                    )}

                    {/* Nút thanh toán */}
                    <div className="text-center mt-4">
                        <button
                            className="btn btn-success btn-lg px-5 py-3"
                            onClick={handlePay}
                            disabled={loading || selectedSeats.length === 0}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Đang xử lý...
                                </>
                            ) : isCounterBooking ? (
                                `💳 Xác nhận thanh toán ${normalizePaymentMethod(paymentMethod)}`
                            ) : (
                                "💳 Thanh toán VNPay"
                            )}
                        </button>
                        {message && (
                            <div className={`mt-3 alert ${message.includes("❌") ? "alert-danger" : "alert-success"} text-center`} style={{ whiteSpace: 'pre-line' }}>
                                {message}
                            </div>
                        )}
                    </div>

                    {/* Thông tin bổ sung */}
                    <div className="text-center mt-3">
                        <small className="text-muted">
                            <i className="bi bi-shield-check"></i>
                            {isCounterBooking
                                ? " Thanh toán trực tiếp tại quầy"
                                : " Thanh toán an toàn với VNPay"}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}