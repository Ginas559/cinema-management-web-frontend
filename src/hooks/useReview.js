import { useState, useEffect } from "react";
import { 
  getAllReviewsByPage, 
  createReview, 
  updateReview, 
  deleteReview 
} from "../services/ReviewService";

export const useReviews = (initialFilters = {}) => {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [appliedFilters, setAppliedFilters] = useState({
    movieTitle: "",
    from: "",
    to: "",
    ...initialFilters,
  });

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllReviewsByPage(
        page,
        size,
        appliedFilters.movieTitle || null,
        appliedFilters.from || null,
        appliedFilters.to || null
      );
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(err.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const createNewReview = async (reviewData) => {
    try {
      console.log("Creating review with data:", reviewData);
      
      const newReview = await createReview(reviewData);
      await fetchReviews();
      return newReview;
    } catch (err) {
      console.error("Error creating review:", err);
      throw err;
    }
  };

  const updateExistingReview = async (reviewId, reviewData) => {
    try {
      console.log("Updating review:", reviewId, reviewData);
      
      const updatedReview = await updateReview(reviewId, reviewData);
      await fetchReviews();
      return updatedReview;
    } catch (err) {
      console.error("Error updating review:", err);
      throw err;
    }
  };

  const deleteExistingReview = async (reviewId) => {
    try {
      console.log("Deleting review:", reviewId);
      
      await deleteReview(reviewId);
      await fetchReviews();
    } catch (err) {
      console.error("Error deleting review:", err);
      throw err;
    }
  };

  const applyFilters = (newFilters, callback) => {
    setAppliedFilters(newFilters);
    setPage(1);
    if (callback) callback();
  };

  const clearFilters = () => {
    const emptyFilters = { movieTitle: "", from: "", to: "" };
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  useEffect(() => {
    fetchReviews();
  }, [page, size, appliedFilters]);

  return {
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
    refetch: fetchReviews,
  };
};