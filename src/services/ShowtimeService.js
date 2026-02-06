import api from "./api";

// --- LẤY SUẤT CHIẾU ---
export async function getShowtimesForNext7Days(movieId) {
  const res = await api.get(`/api/showtime/movie/${movieId}/next7days`);
  return res.data;
}

export async function getAllShowtimesForNext14Days() {
  const res = await api.get("/api/showtime/next14days");
  return res.data;
}

export async function getShowtimeById(showtimeId) {
  const res = await api.get(`/api/showtime/${showtimeId}`);
  return res.data;
}

export async function getShowtimesByDate(movieId, date) {
  const res = await api.get(`/api/showtime/movie/${movieId}/date`, {
    params: { date },
  });
  return res.data;
}

export async function getAvailableDates(movieId) {
  const res = await api.get(`/api/showtime/movie/${movieId}/available-dates`);
  return res.data;
}

export async function getAvailableLanguages(movieId) {
  const res = await api.get(`/api/showtime/movie/${movieId}/languages`);
  return res.data;
}

export async function getSeatsByShowtime(showtimeId) {
  const res = await api.get(`/api/showtime/${showtimeId}/seats`);
  return res.data;
}

export async function updateSeatStatus(seatId, status) {
  const res = await api.put(`/api/seats/${seatId}/status`, { status });
  return res.data;
}

export async function lockSeats(seatIds) {
  const res = await api.post("/api/seats/lock", { seatIds });
  console.log(res.data);
  return res.data;
}

export async function releaseSeats(seatIds) {
  const res = await api.post("/api/seats/release", { seatIds });
  return res.data;
}

export async function checkSeatsAvailability(seatIds) {
  const res = await api.post("/api/seats/check-availability", { seatIds });
  return res.data;
}

// --- PHÒNG ---
export async function getAllRooms() {
  const res = await api.get("/api/rooms");
  return res.data;
}

// --- CRUD SUẤT CHIẾU ---
export async function createShowtime(showtimeData) {
  const res = await api.post("/api/showtime", showtimeData);
  return res.data;
}

export async function updateShowtime(showtimeId, showtimeData) {
  const res = await api.put(`/api/showtime/${showtimeId}`, showtimeData);
  return res.data;
}

export async function deleteShowtime(showtimeId) {
  const res = await api.delete(`/api/showtime/${showtimeId}`);
  return res.data;
}

// --- LẬP LỊCH THÔNG MINH ---
export const generateOptimalSchedule = async ({ roomId, date, movieIds = [], occupancyRate }) => {
    const params = new URLSearchParams();
    if (roomId) params.append("roomId", roomId);
    if (date) params.append("date", date);
    //if (occupancyRate) params.append("occupancyRate", occupancyRate);
    movieIds.forEach(id => params.append("movieIds", id));

    const url = `/api/showtime/generate-optimal-schedule?${params.toString()}`;
    console.log("➡️ Calling:", url);

    const response = await api.post(url); // không cần body
    return response.data;
}
