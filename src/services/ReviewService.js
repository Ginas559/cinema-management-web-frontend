import api from "./api";

const API_BASE_URL = "/api/reviews";

export const getAllReviewsByPage = async (
  page = 1,
  size = 10,
  movieTitle = null,
  from = null,
  to = null
) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("size", size);
    
    if (movieTitle) params.append("movieTitle", movieTitle);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await api.get(`${API_BASE_URL}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error.response?.data || error;
  }
};

/**
 * Lấy review theo ID
 */
export const getReviewById = async (reviewId) => {
  try {
    const response = await api.get(`${API_BASE_URL}/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching review:", error);
    throw error.response?.data || error;
  }
};

/**
 * Tạo review mới
 */
export const createReview = async (reviewData) => {
  try {
    const response = await api.post(API_BASE_URL, reviewData);
    return response.data;
  } catch (error) {
    console.error("Error creating review:", error);
    throw error.response?.data || error;
  }
};

/**
 * Cập nhật review
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await api.put(`${API_BASE_URL}/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error.response?.data || error;
  }
};

/**
 * Xóa review
 */
export const deleteReview = async (reviewId) => {
  try {
    const response = await api.delete(`${API_BASE_URL}/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error.response?.data || error;
  }
};

/**
 * Lấy tất cả reviews của một phim
 */
export const getReviewsByMovie = async (movieId) => {
  try {
    const response = await api.get(`${API_BASE_URL}/movie/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching movie reviews:", error);
    throw error.response?.data || error;
  }
};

/**
 * Lấy reviews của user hiện tại
 */
export const getMyReviews = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/my-reviews`);
    return response.data;
  } catch (error) {
    console.error("Error fetching my reviews:", error);
    throw error.response?.data || error;
  }
};