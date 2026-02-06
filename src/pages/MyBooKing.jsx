import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getBillsByAccount } from "../services/BillService";
import jsPDF from "jspdf";
import "../styles/my-booking.css";
import QRCode from "qrcode";

export default function MyBooking() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const { user } = useContext(AuthContext);
    const accountId = user?.accountId || null;

    useEffect(() => {
        const fetchBills = async () => {
            if (!accountId) {
                setError("Please log in to view your bills");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await getBillsByAccount(accountId);

                if (Array.isArray(data)) {
                    const sortedBills = data.sort(
                        (a, b) => new Date(b.startTime) - new Date(a.startTime)
                    );
                    setBills(sortedBills);
                } else if (data?.error) {
                    setError(data.error);
                } else {
                    console.warn("⚠️ Unexpected data format:", data);
                    setBills([]);
                }
            } catch (err) {
                console.error("❌ Fetch Error:", err);
                setError(err.message || "Unable to load bills. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, [accountId, retryCount]);

    const handleRetry = () => {
        setRetryCount((prev) => prev + 1);
    };

    

    const handlePrint = async (bill, seat) => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a5", // khổ vé xem phim nhỏ gọn
        });

        // 🎨 Nền xám đậm
        doc.setFillColor(45, 45, 45);
        doc.rect(0, 0, 148, 210, "F");

        // 🟨 Khung vé màu sáng
        doc.setFillColor(255, 250, 230);
        doc.roundedRect(10, 10, 128, 190, 5, 5, "F");

        // ===== Header =====
        doc.setTextColor(200, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("ONLINE CINEMA TICKET CinemUTE", 20, 25);

        // Gạch ngang trang trí
        doc.setDrawColor(200, 30, 30);
        doc.setLineWidth(0.5);
        doc.line(15, 30, 133, 30);

        // ===== Nội dung =====
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(13);

        let y = 45;
        doc.text(`Movie: ${bill.movieTitle}`, 20, y);
        doc.text(`Customer: ${bill.customerName}`, 20, (y += 8));
        doc.text(`Room: ${bill.roomName}`, 20, (y += 8));
        doc.text(`Seat: ${seat}`, 20, (y += 8));

        // Thời gian chiếu
        doc.text(
            `Showtime: ${formatTime(bill.startTime)} - ${formatTime(bill.endTime)}`,
            20,
            (y += 10)
        );
        doc.text(`Date: ${formatDate(bill.startTime)}`, 20, (y += 8));

        // Đường gạch nhỏ ngăn cách
        doc.setDrawColor(180, 180, 180);
        doc.line(15, (y += 5), 133, y);

        // Thanh toán
        doc.text(
            `Payment: ${getPaymentMethodDisplay(bill.paymentMethod)}`,
            20,
            (y += 10)
        );
        doc.text(`Total: ${formatCurrency(bill.totalAmount)}`, 20, (y += 8));

        // ===== Dịch vụ =====
        if (bill.orderDetails && bill.orderDetails.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(100, 0, 0);
            doc.text("Services Ordered:", 20, (y += 12));
            doc.setTextColor(0, 0, 0);

            bill.orderDetails.forEach((detail) => {
                const text = `- ${detail.serviceName} ×${detail.quantity} (${formatCurrency(
                    detail.price
                )})`;
                doc.text(text, 25, (y += 8));
            });
        }

        // ===== QR Code =====
        const qrData = JSON.stringify({
            billId: bill.billId,
            bookingId: bill.bookingId,
            movie: bill.movieTitle,
            seat: seat,
            services: bill.orderDetails?.map(
                (d) => `${d.serviceName}×${d.quantity}`
            ) || [],
            date: formatDate(bill.startTime),
        });

        try {
            const qrImage = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
            doc.addImage(qrImage, "PNG", 90, (y += 15)-50, 45, 45);
        } catch (err) {
            console.error("Lỗi tạo mã QR:", err);
        }

        // ===== Footer =====
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 102, 204);
        doc.text("Thank you for choosing our cinema!", 35, 180);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text("Please show this ticket for verification scan.", 33, 188);

        // ===== Lưu file =====
        doc.save(`Ticket_${bill.movieTitle}_${seat}.pdf`);
    };


    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "$0.00";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            return dateString;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            return dateString;
        }
    };

    const getPaymentMethodDisplay = (method) => {
        const methodMap = {
            CREDIT: "Credit Card",
            DEBIT: "Debit Card",
            CASH: "Cash",
            WALLET: "E-Wallet",
            MOMO: "MoMo",
            ZALOPAY: "ZaloPay",
        };
        return methodMap[method] || method;
    };

    if (loading) {
        return (
            <div className="bill-list">
                <div className="bill-loading">
                    <div className="spinner"></div>
                    <p>Loading your bookings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bill-list">
                <div className="bill-error">
                    <h3>⚠️ Error Loading Bills</h3>
                    <p>{error}</p>
                    <button onClick={handleRetry} className="retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (bills.length === 0) {
        return (
            <div className="bill-list">
                <h2 className="bill-title">My Bookings</h2>
                <div className="bill-empty">
                    <div className="empty-icon">🎬</div>
                    <h3>No bookings yet</h3>
                    <p>Book your first movie to see your history here!</p>
                </div>
            </div>
        );
    }

    // Bills display
    return (
        <div className="bill-list">
            <div className="bill-header-section">
                <h2 className="bill-title">My Bookings</h2>
                <p className="bill-subtitle">Total bookings: {bills.length}</p>
            </div>

            <div className="bills-container">
                {bills.map((bill) => (
                    <div key={bill.billId} className="bill-item">
                        <div className="bill-header">
                            <div className="bill-header-left">
                                <div className="bill-movie-title">{bill.movieTitle}</div>
                                <div className="bill-date">{formatDate(bill.startTime)}</div>
                            </div>
                            <div className="bill-header-right">
                                <div className="bill-amount">{formatCurrency(bill.totalAmount)}</div>
                                <div className="bill-payment-badge">
                                    {getPaymentMethodDisplay(bill.paymentMethod)}
                                </div>
                            </div>
                        </div>

                        <div className="bill-details">
                            <div className="bill-info-row">
                                <span className="label">Customer:</span>
                                <span className="value">{bill.customerName}</span>
                            </div>

                            <div className="bill-info-row">
                                <span className="label">Room:</span>
                                <span className="value">{bill.roomName}</span>
                            </div>

                            <div className="bill-info-row">
                                <span className="label">Showtime:</span>
                                <span className="value">
                                    {formatTime(bill.startTime)} - {formatTime(bill.endTime)}
                                </span>
                            </div>

                            {bill.seats?.length > 0 && (
                                <div className="bill-info-row">
                                    <span className="label">Seats:</span>
                                    <span className="value seats-list">
                                        {bill.seats.map((seat, idx) => (
                                            <div key={idx} className="seat-ticket">
                                                <span className="seat-badge">{seat}</span>
                                                <button
                                                    className="print-button"
                                                    onClick={() => handlePrint(bill, seat)}
                                                >
                                                    🖨️ Print Ticket
                                                </button>
                                            </div>
                                        ))}
                                    </span>
                                </div>
                            )}

                            {bill.orderDetails?.length > 0 && (
                                <div className="bill-services">
                                    <div className="services-header">
                                        <strong>🍿 Services Ordered</strong>
                                    </div>
                                    <ul className="services-list">
                                        {bill.orderDetails.map((detail) => (
                                            <li key={detail.id} className="service-item">
                                                <span className="service-name">
                                                    {detail.serviceName}{" "}
                                                    <span className="service-qty">× {detail.quantity}</span>
                                                </span>
                                                <span className="service-price">
                                                    {formatCurrency(detail.price)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="bill-footer">
                                <div className="bill-ids">
                                    <small>Bill ID: {bill.billId}</small>
                                    &nbsp; | &nbsp;
                                    <small>Booking ID: {bill.bookingId}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
