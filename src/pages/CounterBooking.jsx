import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMovieById } from "../services/MovieService";
import OrderService from "./OrderService";
import BookingSummary from "../components/modals/booking/BookingSummary";
import SeatSelector from "../components/modals/booking/SeatSelector";
import PromotionSelector from "../components/PromotionSelector";
import { createServiceOrder, addServiceOrderDetails, deleteServiceOrder } from "../services/ServiceOrderService";
import { useAuth } from "../hooks/useAuth";
import "../styles/booking.css";
import {
    ChevronLeft,
    ChevronRight,
    Ticket,
    Popcorn,
    CreditCard,
    Clock,
    Star,
    Film,
    Shield,
    User
} from "lucide-react";

const postersImport = require.context(
    "../assets/images/posters",
    false,
    /\.(png|jpe?g|svg)$/
);

const posters = {};
postersImport.keys().forEach((key) => {
    const fileName = key.replace("./", "");
    posters[fileName] = postersImport(key);
});

const TABS = ["Customer", "Seats", "Services", "Promotion", "Payment"];

export function CounterBooking() {
    const { movieId, showtimeId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showtime, setShowtime] = useState(null);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [serviceOrderId, setServiceOrderId] = useState(null);
    const [customerPhone, setCustomerPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    const [selectedEventId, setSelectedEventId] = useState(null);
    const [discountPercent, setDiscountPercent] = useState(0);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setLoading(true);
                const movieData = await getMovieById(movieId);
                setMovie(movieData);

                const st = movieData.showtimes?.find(
                    (s) => String(s.showtimeId) === String(showtimeId)
                );
                setShowtime(st);
                setError(null);
            } catch (err) {
                setError("Failed to load movie information. Please try again.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMovie();
    }, [movieId, showtimeId]);

    const handleNextTab = async () => {
        if (activeTabIndex === 0 && (!customerPhone || customerPhone.length < 10)) {
            alert("Vui lòng nhập số điện thoại khách hàng (ít nhất 10 số)!");
            return;
        }

        if (activeTabIndex === 1 && selectedSeats.length === 0) {
            alert("Please select at least one seat!");
            return;
        }

        if (activeTabIndex === 2 && selectedServices.length > 0) {
            try {
                const cashierId = user?.accountId;
                if (!cashierId) throw new Error("Cashier ID not found");

                const orderRes = await createServiceOrder(cashierId, customerPhone);
                const orderId = orderRes.orderId || orderRes.data?.orderId;
                if (!orderId) throw new Error("Order ID not found");

                const detailsPayload = selectedServices.map(s => ({
                    serviceId: s.serviceId,
                    quantity: s.quantity,
                }));

                await addServiceOrderDetails(orderId, detailsPayload);
                setServiceOrderId(orderId);
                localStorage.setItem("currentServiceOrderId", orderId);
            } catch (err) {
                console.error("Failed to auto-submit services:", err);
                alert("Failed to add services: " + (err.response?.data?.message || err.message || "Unknown error"));
                return;
            }
        }

        setActiveTabIndex(prev => Math.min(prev + 1, TABS.length - 1));
    };

    const handleBackTab = async () => {
        if (activeTabIndex === 4 && serviceOrderId) {
            try {
                await deleteServiceOrder(serviceOrderId);
                setServiceOrderId(null);
                localStorage.removeItem("currentServiceOrderId");
            } catch (err) {
                console.error("Failed to delete service order:", err);
            }
        }
        setActiveTabIndex(prev => Math.max(prev - 1, 0));
    };

    const handleSelectSeats = useCallback((seats) => {
        setSelectedSeats(seats);
    }, []);

    const handleUpdateServices = useCallback((services) => {
        setSelectedServices(services);
    }, []);

    const handlePhoneChange = useCallback((e) => {
        setCustomerPhone(e.target.value);
    }, []);

    const handlePromotionChange = useCallback((eventId, percent) => {
        setSelectedEventId(eventId || null);
        setDiscountPercent(percent || 0);
    }, []);

    const totalPrice = useMemo(() => {
        return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    }, [selectedSeats]);

    const renderTabContent = useMemo(() => {
        const currentTab = TABS[activeTabIndex];

        if (currentTab === "Customer") {
            return (
                <div className="tab-content customer-info-tab">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h3 className="mb-4">👤 Thông tin khách hàng</h3>
                            <div className="mb-3">
                                <label htmlFor="customerPhone" className="form-label">
                                    Số điện thoại khách hàng <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="customerPhone"
                                    className="form-control form-control-lg"
                                    placeholder="VD: 0901234567"
                                    value={customerPhone}
                                    onChange={handlePhoneChange}
                                    pattern="[0-9]{10,11}"
                                    required
                                />
                                <div className="form-text">
                                    Nhập số điện thoại của khách hàng để tạo booking
                                </div>
                            </div>
                            <div className="alert alert-info mt-3">
                                <strong>👨‍💼 Nhân viên:</strong> {user?.username || user?.email || "N/A"}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (currentTab === "Seats") {
            return (
                <div className="tab-content">
                    <h3>Select Seats</h3>
                    <div className="alert alert-warning mb-3">
                        <strong>Khách hàng:</strong> {customerPhone}
                    </div>
                    <SeatSelector
                        key={showtimeId}
                        showtimeId={showtimeId}
                        onSelectSeats={handleSelectSeats}
                    />
                    <div className="seat-summary">
                        <p>Selected seats: {selectedSeats.length}</p>
                        <p>Total Price: {totalPrice.toLocaleString()} $</p>
                    </div>
                </div>
            );
        }

        if (currentTab === "Services") {
            return (
                <div className="tab-content empty">
                    <OrderService
                        selectedServices={selectedServices}
                        onUpdateSelectedServices={handleUpdateServices}
                    />
                </div>
            );
        }

        if (currentTab === "Promotion") {
            return (
                <div className="tab-content">
                    <PromotionSelector
                        selectedEventId={selectedEventId}
                        onChange={handlePromotionChange}
                    />
                </div>
            );
        }

        // Payment
        return (
            <div className="tab-content empty payment-tab-content">
                <BookingSummary
                    showtimeId={showtimeId}
                    selectedSeats={selectedSeats}
                    selectedServices={selectedServices}
                    isCounterBooking={true}
                    cashierId={user?.accountId}
                    customerPhone={customerPhone}
                    // Promotions
                    selectedEventId={selectedEventId}
                    discountPercent={discountPercent}
                />
            </div>
        );
    }, [
        activeTabIndex,
        showtimeId,
        customerPhone,
        selectedSeats,
        selectedServices,
        user,
        selectedEventId,
        discountPercent,
        totalPrice,
        handleSelectSeats,
        handleUpdateServices,
        handlePhoneChange,
        handlePromotionChange
    ]);

    if (loading) return <div className="booking-status">Loading movie information...</div>;
    if (error) return <div className="booking-status error">{error}</div>;

    const getPosterSrc = (posterUrl) => {
        if (!posterUrl) return "/fallback.jpg";
        if (posterUrl.startsWith("http")) return posterUrl;
        const fileName = posterUrl.split("/").pop();
        return posters[fileName] || "/fallback.jpg";
    };
    const finalPosterUrl = getPosterSrc(movie.posterUrl);

    let formattedTime = "N/A";
    let formattedDate = "N/A";
    if (showtime?.startTime) {
        const dt = new Date(showtime.startTime.length === 16 ? showtime.startTime + ":00" : showtime.startTime);
        if (!isNaN(dt)) {
            formattedTime = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            formattedDate = dt.toLocaleDateString();
        }
    }

    return (
        <div className="booking-page">
            <div className="booking-container">
                <div className="movie-summary">
                    <div className="badge bg-primary mb-3">🏪 COUNTER BOOKING</div>
                    <img src={finalPosterUrl} alt={movie.title} className="summary-poster" />
                    <h2 className="summary-title">{movie.title}</h2>
                    <p className="summary-info">Cinema: CinemUTE Thu Duc</p>
                    <p className="summary-info">Showtime: {formattedTime} - {formattedDate}</p>
                    <p className="summary-info">{showtime?.roomName || "N/A"}</p>
                    <div className="summary-details">
                        <div className="detail-item">
                            <Film size={16} />
                            <span>{movie.genres?.join(", ")}</span>
                        </div>
                        <div className="detail-item">
                            <Clock size={16} />
                            <span>{movie.duration} minutes</span>
                        </div>
                        <div className="detail-item">
                            <Star size={16} />
                            <span>{movie.rating?.toFixed(1)}/10</span>
                        </div>
                        <div className="detail-item">
                            <Shield size={16} />
                            <span>Age limit: <span className="age-rating-badge">{movie.ageRating}</span></span>
                        </div>
                    </div>
                    {customerPhone && (
                        <div className="alert alert-info mt-3">
                            <strong>📱 Customer:</strong> {customerPhone}
                        </div>
                    )}
                    <div className="summary-total">
                        <h4>SUBTOTAL</h4>
                        <p>{totalPrice.toLocaleString()} $</p>
                    </div>
                </div>

                <div className="booking-details">
                    <div className="booking-header">
                        <button className="back-button" onClick={() => navigate("/mov-bk")}>
                            <ChevronLeft size={24} />
                            <span>Back to movie selection</span>
                        </button>
                    </div>

                    <div className="booking-tabs">
                        <div className={`tab-item ${activeTabIndex >= 0 ? "active" : ""}`}>
                            <User />
                            <span>01. CUSTOMER INFO</span>
                        </div>
                        <div className={`tab-item ${activeTabIndex >= 1 ? "active" : ""}`}>
                            <Ticket />
                            <span>02. SELECT SEATS</span>
                        </div>
                        <div className={`tab-item ${activeTabIndex >= 2 ? "active" : ""}`}>
                            <Popcorn />
                            <span>03. SELECT SERVICES</span>
                        </div>
                        <div className={`tab-item ${activeTabIndex >= 3 ? "active" : ""}`}>
                            <Ticket />
                            <span>04. PROMOTION</span>
                        </div>
                        <div className={`tab-item ${activeTabIndex >= 4 ? "active" : ""}`}>
                            <CreditCard />
                            <span>05. PAYMENT</span>
                        </div>
                    </div>

                    <div className="tab-content-container">
                        {renderTabContent}
                    </div>

                    <div className="tab-navigation">
                        <button onClick={handleBackTab} disabled={activeTabIndex === 0}>
                            <ChevronLeft size={16} /> Back
                        </button>
                        <button onClick={handleNextTab} disabled={activeTabIndex === TABS.length - 1}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}