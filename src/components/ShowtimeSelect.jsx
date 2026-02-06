import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useShowtimes } from "../hooks/useShowtimes";
import "../styles/showtime-select.css";

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

export function SelectShowtime() {
    const [activeTab, setActiveTab] = useState("overview");
    const { movieId } = useParams();
    const navigate = useNavigate();

    const {
        movie,
        filteredShowtimes,
        selectedDate,
        loading,
        error,
        emptyMessage,
        handleDateSelect,
        formatDate,
    } = useShowtimes(movieId);

    const getNext7Days = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const next7Days = getNext7Days();

    const formatDisplayDate = (date) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = days[date.getDay()];
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const today = new Date();
        if (formatDate(date) === formatDate(today)) return `Today, ${day}/${month}`;
        return `${dayName}, ${day}/${month}`;
    };

    const parseShowtimeDisplay = (startTime) => {
        if (!startTime) return "Unknown time";

        try {
            let timeString = startTime;
            if (timeString.length === 16 && timeString.includes("T")) {
                timeString += ":00";
            }

            const date = new Date(timeString);

            if (isNaN(date.getTime())) {
                console.error("Invalid date:", startTime);
                return "Unknown time";
            }

            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        } catch (error) {
            console.error("Error parsing time:", startTime, error);
            return "Unknown time";
        }
    };

    if (loading) return <div className="select-showtime-status">Loading...</div>;
    if (error) return <div className="select-showtime-status error">{error}</div>;
    if (!movie) return <div className="select-showtime-status">Movie not found.</div>;

    let posterSrc = "/fallback.jpg";
    if (movie.posterUrl) {
        const fileName = movie.posterUrl.split("/").pop();
        posterSrc = posters[fileName] || movie.posterUrl || "/fallback.jpg";
    }

    return (
        <div className="select-showtime-page">
            {/* Movie Header */}
            <div className="select-showtime-movie-header">
                <img
                    src={posterSrc}
                    alt={movie.title}
                    className="select-showtime-movie-poster"
                />
                <div className="select-showtime-movie-info">
                    <h2>Select Showtime: {movie.title}</h2>
                    <p>Duration: {movie.duration} minutes</p>
                </div>
            </div>

            {/* Date Filter */}
            <div className="select-showtime-date-filter">
                <h3>Select Date:</h3>
                <div className="select-showtime-date-buttons">
                    {next7Days.map((date, index) => {
                        const dateStr = formatDate(date);
                        return (
                            <button
                                key={index}
                                className={`select-showtime-date-btn ${selectedDate === dateStr ? "active" : ""
                                    }`}
                                onClick={() => handleDateSelect(date)}
                            >
                                {formatDisplayDate(date)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Showtimes Section */}
            <div className="select-showtime-section">
                <h3>Showtimes on {selectedDate}:</h3>
                <div className="select-showtime-list">
                    {filteredShowtimes.length > 0 ? (
                        filteredShowtimes.map((st) => {

                            const timeDisplay = parseShowtimeDisplay(st.startTime);

                            return (
                                <button
                                    key={st.showtimeId}
                                    onClick={() => {
                                        const role = localStorage.getItem("role") || sessionStorage.getItem("role");
                                        const path =
                                            role === "STAFF"
                                                ? `/pos/${movieId}/${st.showtimeId}` // nhân viên
                                                : `/booking/${movieId}/${st.showtimeId}`; // khách hàng
                                        navigate(path);
                                    }}

                                    className="select-showtime-btn"
                                >
                                    <span className="select-showtime-time">{timeDisplay}</span>
                                    {st.language && (
                                        <span className="select-showtime-language">{st.language}</span>
                                    )}
                                    {(st.roomName || st.room?.name) && (
                                        <span className="select-showtime-room">
                                            {st.roomName || st.room?.name || "Unknown Room"}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    ) : (
                        <p className="select-showtime-no-showtime">
                            {emptyMessage || "No showtimes available for this date."}
                        </p>
                    )}
                </div>
            </div>

            {/* Tabs Section */}
            <section className="select-showtime-tabs-section">
                <button
                    className={`select-showtime-tab-button ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </button>
                <button
                    className={`select-showtime-tab-button ${activeTab === "cast" ? "active" : ""}`}
                    onClick={() => setActiveTab("cast")}
                >
                    Cast
                </button>
                <button
                    className={`select-showtime-tab-button ${activeTab === "reviews" ? "active" : ""}`}
                    onClick={() => setActiveTab("reviews")}
                >
                    Reviews
                </button>
            </section>

            {/* Tab Content */}
            <section className="select-showtime-tab-content">
                {activeTab === "overview" && (
                    <div className="select-showtime-tab-overview select-showtime-tab-panel">
                        <h3>Overview</h3>
                        <p>{movie.description}</p>
                        <div className="select-showtime-movie-details">
                            <p>
                                <strong>Duration:</strong> {movie.duration} minutes
                            </p>
                            <p>
                                <strong>Rating:</strong> {movie.rating ? Number(movie.rating).toFixed(2) : "N/A"}/10
                            </p>
                            <p>
                                <strong>Age Rating:</strong> {movie.ageRating}
                            </p>
                            <p>
                                <strong>Genres:</strong> {movie.genres?.join(", ")}
                            </p>
                            <p>
                                <strong>Languages:</strong> {movie.languages?.join(", ")}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === "cast" && (
                    <div className="select-showtime-tab-cast select-showtime-tab-panel">
                        <h3>Cast</h3>
                        {movie.cast && movie.cast.length > 0 ? (
                            <ul className="select-showtime-cast-list">
                                {movie.cast.map((actor, index) => (
                                    <li key={index}>{actor}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No cast information available.</p>
                        )}
                    </div>
                )}

                {activeTab === "reviews" && (
                    <div className="select-showtime-tab-reviews select-showtime-tab-panel">
                        <h3>Reviews</h3>
                        {movie.reviews && movie.reviews.length > 0 ? (
                            <div className="select-showtime-reviews-list">
                                {movie.reviews.map((review) => (
                                    <div key={review.reviewId} className="select-showtime-review-item">
                                        <div className="select-showtime-review-header">
                                            <span className="select-showtime-review-author">
                                                {review.cusName || "Anonymous"}
                                            </span>
                                            <span className="select-showtime-review-rating">
                                                ⭐ {review.rating}/10
                                            </span>
                                        </div>
                                        <p className="select-showtime-review-content">{review.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No reviews available yet.</p>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}