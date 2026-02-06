import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMovieById } from "../services/MovieService";
import { getSeatsByShowtime, lockSeats, releaseSeats } from "../services/ShowtimeService";
import { createServiceOrder, addServiceOrderDetails, deleteServiceOrder } from "../services/ServiceOrderService";

import SeatSelector from "../components/modals/booking/SeatSelector";
import OrderService from "./OrderService";
import PromotionSelector from "../components/PromotionSelector";
import BookingSummary from "../components/modals/booking/BookingSummary";

import "../styles/booking.css";
import { ChevronLeft, ChevronRight, Ticket, Popcorn, CreditCard, Clock, Star, Film, Shield } from "lucide-react";

const TABS = ["Seats", "Services", "Promotion", "Payment"];

export default function Booking() {
  const { movieId, showtimeId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceOrderId, setServiceOrderId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Load movie + showtime info
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const movieData = await getMovieById(movieId);
        setMovie(movieData);

        const st = movieData.showtimes?.find(s => String(s.showtimeId) === String(showtimeId));
        setShowtime(st);

        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load movie information.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [movieId, showtimeId]);

  const handleSelectSeats = useCallback((seats) => setSelectedSeats(seats), []);
  const handleUpdateServices = useCallback((services) => setSelectedServices(services), []);
  const handlePromotionChange = useCallback((eventId, percent) => {
    setSelectedEventId(eventId || null);
    setDiscountPercent(percent || 0);
  }, []);

  const totalPrice = useMemo(() => selectedSeats.reduce((sum, s) => sum + s.price, 0), [selectedSeats]);

  // Tab navigation
  const handleNextTab = async () => {
    if (activeTabIndex === 0 && selectedSeats.length === 0) {
      alert("Please select at least one seat!");
      return;
    }

    if (activeTabIndex === 1 && selectedServices.length > 0) {
      try {
        const accountId = localStorage.getItem("accountId") || sessionStorage.getItem("accountId");
        const orderRes = await createServiceOrder(accountId);
        const orderId = orderRes.orderId || orderRes.data?.orderId;
        if (!orderId) throw new Error("Order ID not found");

        const detailsPayload = selectedServices.map(s => ({ serviceId: s.serviceId, quantity: s.quantity }));
        await addServiceOrderDetails(orderId, detailsPayload);
        setServiceOrderId(orderId);
        localStorage.setItem("currentServiceOrderId", orderId);
      } catch (err) {
        console.error("Failed to add services:", err);
        alert("Failed to add services: " + (err.message || "Unknown error"));
        return;
      }
    }

    setActiveTabIndex(prev => Math.min(prev + 1, TABS.length - 1));
  };

  const handleBackTab = async () => {
    if (activeTabIndex === 3 && serviceOrderId) {
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

  // Render content for each tab
  const renderTabContent = useMemo(() => {
    const currentTab = TABS[activeTabIndex];

    if (currentTab === "Seats") {
      return (
        <div className="tab-content">
          <h3>Select Seats</h3>
          <SeatSelector showtimeId={showtimeId} onSelectSeats={handleSelectSeats} />
          <div className="seat-summary">
            <p>Selected seats: {selectedSeats.length}</p>
            <p>Total Price: {totalPrice.toLocaleString()} $</p>
          </div>
        </div>
      );
    }

    if (currentTab === "Services") {
      return (
        <div className="tab-content">
          <OrderService selectedServices={selectedServices} onUpdateSelectedServices={handleUpdateServices} />
        </div>
      );
    }

    if (currentTab === "Promotion") {
      return (
        <div className="tab-content">
          <PromotionSelector selectedEventId={selectedEventId} onChange={handlePromotionChange} />
        </div>
      );
    }

    return (
      <div className="tab-content">
        <BookingSummary
          showtimeId={showtimeId}
          selectedSeats={selectedSeats}
          selectedServices={selectedServices}
          selectedEventId={selectedEventId}
          discountPercent={discountPercent}
        />
      </div>
    );
  }, [
    activeTabIndex,
    showtimeId,
    selectedSeats,
    selectedServices,
    selectedEventId,
    discountPercent,
    totalPrice,
    handleSelectSeats,
    handleUpdateServices,
    handlePromotionChange
  ]);

  if (loading) return <div className="booking-status">Loading movie information...</div>;
  if (error) return <div className="booking-status error">{error}</div>;

  const getPosterSrc = (posterUrl) => {
    if (!posterUrl) return "/fallback.jpg";
    if (posterUrl.startsWith("http")) return posterUrl;
    return `/assets/images/posters/${posterUrl.split("/").pop()}`;
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
          <img src={finalPosterUrl} alt={movie.title} className="summary-poster" />
          <h2 className="summary-title">{movie.title}</h2>
          <p className="summary-info">Cinema: CinemUTE Thu Duc</p>
          <p className="summary-info">Showtime: {formattedTime} - {formattedDate}</p>
          <p className="summary-info">{showtime?.roomName || "N/A"}</p>
          <div className="summary-details">
            <div className="detail-item"><Film size={16} /><span>{movie.genres?.join(", ")}</span></div>
            <div className="detail-item"><Clock size={16} /><span>{movie.duration} minutes</span></div>
            <div className="detail-item"><Star size={16} /><span>{movie.rating.toFixed(1)}/10</span></div>
            <div className="detail-item"><Shield size={16} /><span>Age limit: <span className="age-rating-badge">{movie.ageRating}</span></span></div>
          </div>
          <div className="summary-total">
            <h4>SUBTOTAL</h4>
            <p>{totalPrice.toLocaleString()} $</p>
          </div>
        </div>

        <div className="booking-details">
          <div className="booking-header">
            <button className="back-button" onClick={() => navigate("/mov-bk")}>
              <ChevronLeft size={24} /><span>Back to movie selection</span>
            </button>
          </div>

          <div className="booking-tabs">
            <div className={`tab-item ${activeTabIndex >= 0 ? "active" : ""}`}><Ticket /><span>01. SELECT SEATS</span></div>
            <div className={`tab-item ${activeTabIndex >= 1 ? "active" : ""}`}><Popcorn /><span>02. SELECT SERVICES</span></div>
            <div className={`tab-item ${activeTabIndex >= 2 ? "active" : ""}`}><Ticket /><span>03. PROMOTION</span></div>
            <div className={`tab-item ${activeTabIndex >= 3 ? "active" : ""}`}><CreditCard /><span>04. PAYMENT</span></div>
          </div>

          <div className="tab-content-container">{renderTabContent}</div>

          <div className="tab-navigation">
            <button onClick={handleBackTab} disabled={activeTabIndex === 0}><ChevronLeft size={16} /> Back</button>
            <button onClick={handleNextTab} disabled={activeTabIndex === TABS.length - 1}>Next <ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
