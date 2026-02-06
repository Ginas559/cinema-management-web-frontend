import { useState, useContext, useEffect } from "react";
import { Star, Filter, Calendar, Film, X, Plus, Send, Search, Edit2, Trash2 } from "lucide-react";
import { useReviews } from "../hooks/useReview";
import { useMovies } from "../hooks/useMovies";
import { AuthContext } from "../context/AuthContext";
import "../styles/user-reviews.css";

export default function UserReviews() {
  const { user } = useContext(AuthContext);
  const {
    reviews,
    page,
    setPage,
    size,
    setSize,
    loading,
    error,
    appliedFilters,
    applyFilters,
    clearFilters,
    createNewReview,
    updateExistingReview,
    deleteExistingReview,
  } = useReviews();

  const { movies, fetchAllMovies } = useMovies();

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [localFilters, setLocalFilters] = useState({
    movieTitle: "",
    from: "",
    to: "",
  });

  const [newReview, setNewReview] = useState({
    movieId: "",
    movieTitle: "",
    content: "",
    rating: 5,
  });

  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState([]);

  useEffect(() => {
    fetchAllMovies();
  }, []);

  useEffect(() => {
    if (movieSearchQuery.trim() === "") {
      setFilteredMovies([]);
      return;
    }

    const filtered = movies.filter((movie) =>
      movie.title?.toLowerCase().includes(movieSearchQuery.toLowerCase())
    );
    setFilteredMovies(filtered.slice(0, 10));
  }, [movieSearchQuery, movies]);

  useEffect(() => {
    setLocalFilters(appliedFilters);
  }, [appliedFilters]);

  const handleLocalFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    applyFilters(localFilters, () => setShowFilters(false));
  };

  const handleClearFilters = () => {
    const emptyFilters = { movieTitle: "", from: "", to: "" };
    setLocalFilters(emptyFilters);
    clearFilters();
  };

  const handleMovieSelect = (movie) => {
    setNewReview((prev) => ({
      ...prev,
      movieId: movie.movieId,
      movieTitle: movie.title,
    }));
    setMovieSearchQuery(movie.title);
    setShowMovieDropdown(false);
  };

  const resetForm = () => {
    setNewReview({ movieId: "", movieTitle: "", content: "", rating: 5 });
    setMovieSearchQuery("");
    setEditingReview(null);
    setSubmitError("");
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!user) {
      setSubmitError("Please login to create a review");
      return;
    }

    if (!newReview.movieId) {
      setSubmitError("Please select a movie");
      return;
    }

    try {
      if (editingReview) {
        await updateExistingReview(editingReview.reviewId, {
          movieId: newReview.movieId,
          content: newReview.content,
          rating: newReview.rating,
        });
        setSubmitSuccess("Review updated successfully!");
      } else {
        await createNewReview({
          movieId: newReview.movieId,
          content: newReview.content,
          rating: newReview.rating,
        });
        setSubmitSuccess("Review created successfully!");
      }

      setShowCreateReview(false);
      resetForm();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (error) {
      setSubmitError(error.message || "Failed to save review");
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewReview({
      movieId: review.movieId,
      movieTitle: review.movieTitle,
      content: review.content,
      rating: review.rating,
    });
    setMovieSearchQuery(review.movieTitle);
    setShowCreateReview(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await deleteExistingReview(reviewId);
      setSubmitSuccess("Review deleted successfully!");
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (error) {
      setSubmitError(error.message || "Failed to delete review");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating) => (
    <div className="user-reviews-stars-container">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={
            star <= Math.round(rating / 2)
              ? "user-reviews-star-filled"
              : "user-reviews-star-empty"
          }
        />
      ))}
    </div>
  );

  const renderRatingSelector = (currentRating, onChange) => (
    <div className="user-reviews-rating-selector">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={`user-reviews-rating-btn ${
            currentRating >= rating ? "active" : ""
          }`}
        >
          {rating}
        </button>
      ))}
    </div>
  );

  return (
    <div className="user-reviews user-reviews-page">
      <div className="user-reviews-container">
        {/* Header */}
        <div className="user-reviews-header">
          <div className="user-reviews-header-content">
            <h1 className="user-reviews-page-title">User Reviews</h1>
            <div className="user-reviews-header-actions">
              {user && (
                <button
                  onClick={() => {
                    setShowCreateReview(!showCreateReview);
                    if (showCreateReview) resetForm();
                  }}
                  className="user-reviews-btn-create"
                >
                  <Plus size={20} />
                  New Review
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="user-reviews-btn-filter"
              >
                <Filter size={20} />
                {showFilters ? "Hide" : "Filter"}
              </button>
            </div>
          </div>

          {/* Success/Error */}
          {submitSuccess && (
            <div className="user-reviews-alert user-reviews-alert-success">
              {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className="user-reviews-alert user-reviews-alert-error">
              {submitError}
            </div>
          )}

          {/* Create/Edit Form */}
          {showCreateReview && (
            <form
              onSubmit={handleCreateReview}
              className="user-reviews-create-form"
            >
              <h3 className="user-reviews-form-title">
                {editingReview ? "Edit Review" : "Create New Review"}
              </h3>

              {/* Movie Search */}
              <div className="user-reviews-form-group">
                <label className="user-reviews-form-label">
                  <Film size={16} />
                  Search Movie
                </label>
                <div className="user-reviews-movie-search-wrapper">
                  <div className="user-reviews-search-input-wrapper">
                    <Search size={16} className="user-reviews-search-icon" />
                    <input
                      type="text"
                      value={movieSearchQuery}
                      onChange={(e) => {
                        setMovieSearchQuery(e.target.value);
                        setShowMovieDropdown(true);
                      }}
                      onFocus={() => setShowMovieDropdown(true)}
                      placeholder="Type to search for a movie..."
                      className="user-reviews-form-input user-reviews-search-input"
                      autoComplete="off"
                      disabled={!!editingReview}
                    />
                    {movieSearchQuery && !editingReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setMovieSearchQuery("");
                          setNewReview((prev) => ({
                            ...prev,
                            movieId: "",
                            movieTitle: "",
                          }));
                          setShowMovieDropdown(false);
                        }}
                        className="user-reviews-clear-search"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showMovieDropdown && movieSearchQuery && !editingReview && (
                    <div className="user-reviews-movie-dropdown">
                      {filteredMovies.length > 0 ? (
                        filteredMovies.map((movie) => (
                          <div
                            key={movie.movieId}
                            onClick={() => handleMovieSelect(movie)}
                            className="user-reviews-movie-option"
                          >
                            <div className="user-reviews-movie-option-content">
                              {movie.posterUrl && (
                                <img
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  className="user-reviews-movie-thumbnail"
                                />
                              )}
                              <div className="user-reviews-movie-info-dropdown">
                                <p className="user-reviews-movie-title-dropdown">
                                  {movie.title}
                                </p>
                                <p className="user-reviews-movie-year">
                                  {movie.releaseDate
                                    ? new Date(movie.releaseDate).getFullYear()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="user-reviews-no-results">
                          No movies found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Movie Display */}
                {newReview.movieId && (
                  <div className="user-reviews-selected-movie">
                    <Film size={14} />
                    <span>Selected: {newReview.movieTitle}</span>
                  </div>
                )}
              </div>

              <div className="user-reviews-form-group">
                <label className="user-reviews-form-label">
                  <Star size={16} />
                  Rating (1-10)
                </label>
                {renderRatingSelector(newReview.rating, (rating) =>
                  setNewReview((prev) => ({ ...prev, rating }))
                )}
              </div>

              <div className="user-reviews-form-group">
                <label className="user-reviews-form-label">Review Content</label>
                <textarea
                  value={newReview.content}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Write your review here..."
                  className="user-reviews-form-textarea"
                  rows="4"
                  minLength="10"
                  maxLength="1000"
                  required
                />
                <small className="user-reviews-char-count">
                  {newReview.content.length}/1000 characters
                </small>
              </div>

              <div className="user-reviews-form-actions">
                <button type="submit" className="user-reviews-btn-submit">
                  <Send size={16} />
                  {editingReview ? "Update Review" : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateReview(false);
                    resetForm();
                  }}
                  className="user-reviews-btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="user-reviews-filters-panel">
              <div className="user-reviews-filters-grid">
                <div className="user-reviews-filter-item">
                  <label className="user-reviews-filter-label">
                    <Calendar size={16} className="user-reviews-label-icon" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={localFilters.from}
                    onChange={(e) =>
                      handleLocalFilterChange("from", e.target.value)
                    }
                    className="user-reviews-filter-input"
                  />
                </div>

                <div className="user-reviews-filter-item">
                  <label className="user-reviews-filter-label">
                    <Calendar size={16} className="user-reviews-label-icon" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={localFilters.to}
                    onChange={(e) =>
                      handleLocalFilterChange("to", e.target.value)
                    }
                    className="user-reviews-filter-input"
                  />
                </div>
              </div>

              <div className="user-reviews-filter-actions">
                <button
                  onClick={handleApplyFilters}
                  className="user-reviews-btn-apply"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="user-reviews-btn-clear"
                >
                  <X size={16} />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="user-reviews-error-container">
            <p className="user-reviews-error-text">{error}</p>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="user-reviews-loading-container">
            <div className="user-reviews-spinner"></div>
            <p className="user-reviews-loading-text">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="user-reviews-empty-container">
            <p className="user-reviews-empty-text">No reviews found</p>
          </div>
        ) : (
          <div className="user-reviews-list">
            {reviews.map((review) => (
              <div key={review.reviewId} className="user-reviews-card">
                <div className="user-reviews-card-header">
                  <div className="user-reviews-card-info">
                    <div className="user-reviews-user-rating">
                      <h3 className="user-reviews-user-name">{review.cusName}</h3>
                      {renderStars(review.rating)}
                      <span className="user-reviews-rating-number">
                        {review.rating}/10
                      </span>
                    </div>
                    <p className="user-reviews-movie-info">
                      <Film size={14} />
                      <span className="user-reviews-movie-title">
                        {review.movieTitle}
                      </span>
                    </p>
                  </div>
                  <div className="user-reviews-card-actions">
                    <span className="user-reviews-date">
                      {formatDate(review.createdAt)}
                    </span>
                    {user && review.customerId === user.customerId && (
                      <div className="user-reviews-action-buttons">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="user-reviews-btn-edit"
                          title="Edit review"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.reviewId)}
                          className="user-reviews-btn-delete"
                          title="Delete review"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="user-reviews-content">{review.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && reviews.length > 0 && (
          <div className="user-reviews-pagination-container">
            <div className="user-reviews-pagination-content">
              <div className="user-reviews-page-size-selector">
                <label className="user-reviews-page-size-label">
                  Items per page:
                </label>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="user-reviews-page-size-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="user-reviews-pagination-controls">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="user-reviews-btn-pagination"
                >
                  Previous
                </button>
                <span className="user-reviews-page-number">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={reviews.length < size}
                  className="user-reviews-btn-pagination"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}