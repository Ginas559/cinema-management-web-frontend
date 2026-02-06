import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking } from "../../../services/BookingService";
import { createBill } from "../../../services/BillService";
import { CheckCircle, XCircle, Loader, AlertCircle } from "lucide-react";
import "../../../styles/payment-result.css";

export default function PaymentResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);

    const successParam = params.get("success");
    const vnpResponseCode = params.get("vnp_ResponseCode");
    const vnpMessage = params.get("vnp_Message") || params.get("message");
    const vnpTxnRef = params.get("vnp_TxnRef");
    const vnpAmount = params.get("vnp_Amount");
    const vnpBankCode = params.get("vnp_BankCode");
    const vnpTransactionNo = params.get("vnp_TransactionNo");

    const success = successParam === "true" || vnpResponseCode === "00";

    const called = useRef(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [bookingData, setBookingData] = useState(null);

    useEffect(() => {
        const handleCreateBookingAndBill = async () => {
            if (called.current) return;
            called.current = true;

            if (!success) {
                localStorage.removeItem("pendingBill");

                const errorMessages = {
                    "24": "Payment cancelled by user",
                    "07": "Transaction suspected of fraud",
                    "09": "Card not registered for Internet Banking service",
                    "10": "Card authentication information is incorrect",
                    "11": "Payment timeout expired",
                    "12": "Card is locked",
                    "13": "Incorrect transaction authentication password",
                    "51": "Insufficient account balance",
                    "65": "Account has exceeded daily transaction limit",
                    "75": "Bank is under maintenance",
                    "79": "Transaction exceeded password retry limit"
                };

                setError(
                    errorMessages[vnpResponseCode] ||
                    vnpMessage ||
                    "Payment failed"
                );
                return;
            }

            try {
                setProcessing(true);

                const pendingBillStr = localStorage.getItem("pendingBill");
                if (!pendingBillStr) {
                    throw new Error("Booking information not found. Please book again.");
                }

                const pendingBill = JSON.parse(pendingBillStr);
                if (!pendingBill.accountId || !pendingBill.showtimeId || !pendingBill.seatIds?.length) {
                    throw new Error("Missing booking information. Please try again.");
                }

                // 1) Create booking
                const bookingResponse = await createBooking(
                    pendingBill.showtimeId,
                    pendingBill.accountId,
                    pendingBill.seatIds,
                    pendingBill.serviceOrderId
                );

                let bookingId = bookingResponse?.bookingId || bookingResponse?.data?.bookingId;
                let totalAmount = bookingResponse?.totalAmount || bookingResponse?.data?.totalAmount;
                if (!bookingId) {
                    console.error("No booking ID found in response:", bookingResponse);
                    throw new Error("Unable to create booking. Please try again.");
                }

                // 2) Create bill (include eventId if any)
                const billPayload = {
                    bookingId: bookingId,
                    paymentMethod: pendingBill.paymentMethod || "CREDIT",
                    totalAmount: pendingBill.totalAmount,
                    serviceOrderId: pendingBill.serviceOrderId || null,
                    eventId: pendingBill.eventId || null,
                    discountPercent: pendingBill.discountPercent || null
                };

                const billResponse = await createBill(billPayload);
                let billId = billResponse?.billId || billResponse?.data?.billId;

                setBookingData({
                    bookingId: bookingId,
                    billId: billId,
                    totalAmount: pendingBill.totalAmountVND,
                    totalAmountUSD: pendingBill.totalAmount,
                    transactionRef: vnpTxnRef || vnpTransactionNo,
                    bankCode: vnpBankCode,
                    seats: pendingBill.selectedSeats,
                    services: pendingBill.selectedServices
                });

                localStorage.removeItem("pendingBill");
                localStorage.removeItem("currentShowtimeId");
                localStorage.removeItem("selectedSeatIds");
                localStorage.removeItem("currentServiceOrderId");
                localStorage.removeItem("totalAmount");
                localStorage.removeItem("paymentMethod");

                setProcessing(false);

            } catch (err) {
                console.error("Error creating booking/bill:", err);
                console.error("Error details:", err.response?.data);

                setError(
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to complete booking"
                );
                setProcessing(false);

            }
        };

        handleCreateBookingAndBill();
    }, [success, vnpResponseCode, vnpTxnRef, vnpTransactionNo, vnpBankCode, successParam, vnpMessage]);

    useEffect(() => {
        if (bookingData && !processing) {
            const timer = setTimeout(() => {
                navigate("/mov-bk");
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [bookingData, processing, navigate]);

    if (processing) {
        return (
            <div className="payment-result-container">
                <div className="payment-result-card payment-result-processing">
                    <Loader className="payment-result-icon payment-result-icon-spin" size={64} />
                    <h2>Processing your booking...</h2>
                    <p>Please wait a moment, we are confirming your booking and creating your invoice.</p>
                    <div className="payment-result-progress-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }

    if (!success || error) {
        return (
            <div className="payment-result-container">
                <div className="payment-result-card payment-result-error">
                    {vnpResponseCode === "24" || successParam === "false" ? (
                        <AlertCircle className="payment-result-icon" size={64} />
                    ) : (
                        <XCircle className="payment-result-icon" size={64} />
                    )}
                    <h2>
                        {vnpResponseCode === "24" || successParam === "false"
                            ? "Payment Cancelled"
                            : "Payment Failed"}
                    </h2>
                    <p>{error || "Transaction failed. Please try again."}</p>

                    {(vnpTxnRef || vnpTransactionNo) && (
                        <div className="payment-result-transaction-info">
                            <small>Transaction ID: {vnpTxnRef || vnpTransactionNo}</small>
                            {vnpBankCode && <small className="d-block mt-1">Bank: {vnpBankCode}</small>}
                        </div>
                    )}

                    <div className="payment-result-button-group">
                        <button onClick={() => navigate(-1)} className="payment-result-btn-secondary">
                            Try Again
                        </button>
                        <button onClick={() => navigate("/mov-bk")} className="payment-result-btn-primary">
                            Go to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (bookingData) {
        return (
            <div className="payment-result-container">
                <div className="payment-result-card payment-result-success">
                    <CheckCircle className="payment-result-icon" size={64} />
                    <h2>Payment Successful!</h2>
                    <p>Your booking has been confirmed.</p>

                    <div className="payment-result-booking-details">
                        <div className="payment-result-detail-row">
                            <span className="payment-result-label">Booking ID:</span>
                            <span className="payment-result-value">{bookingData.bookingId}</span>
                        </div>
                        {bookingData.billId && (
                            <div className="payment-result-detail-row">
                                <span className="payment-result-label">Bill ID:</span>
                                <span className="payment-result-value">{bookingData.billId}</span>
                            </div>
                        )}
                        {bookingData.transactionRef && (
                            <div className="payment-result-detail-row">
                                <span className="payment-result-label">Transaction ID:</span>
                                <span className="payment-result-value">{bookingData.transactionRef}</span>
                            </div>
                        )}
                        {bookingData.bankCode && (
                            <div className="payment-result-detail-row">
                                <span className="payment-result-label">Bank:</span>
                                <span className="payment-result-value">{bookingData.bankCode}</span>
                            </div>
                        )}
                        <div className="payment-result-detail-row payment-result-highlight">
                            <span className="payment-result-label">Total Amount:</span>
                            <span className="payment-result-value">
                                ${bookingData.totalAmountUSD?.toLocaleString()}
                                <small> ({bookingData.totalAmount?.toLocaleString()} VND)</small>
                            </span>
                        </div>
                    </div>

                    {/* Booked Seats */}
                    {bookingData.seats && bookingData.seats.length > 0 && (
                        <div className="payment-result-booked-items">
                            <h4>💺 Booked Seats:</h4>
                            <div className="payment-result-seats-list">
                                {bookingData.seats.map((seat, idx) => (
                                    <span key={idx} className="payment-result-seat-badge">
                                        {seat.row}{seat.col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ordered Services */}
                    {bookingData.services && bookingData.services.length > 0 && (
                        <div className="payment-result-booked-items">
                            <h4>🍿 Ordered Services:</h4>
                            <ul className="payment-result-services-list">
                                {bookingData.services.map((service, idx) => (
                                    <li key={idx}>
                                        {service.name} × {service.quantity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className="payment-result-redirect-message">
                        Redirecting to home page in 7 seconds...
                    </p>

                    <div className="payment-result-button-group">
                        <button
                            onClick={() => navigate("/mov-bk")}
                            className="payment-result-btn-primary"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={() => {
                                const accountId = localStorage.getItem("accountId") || sessionStorage.getItem("accountId");
                                navigate(`/bills/${accountId}`);
                            }}
                            className="payment-result-btn-secondary"
                        >
                            View Bills
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}