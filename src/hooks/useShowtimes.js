import { useEffect, useState, useCallback } from 'react';
import {
  getShowtimesForNext7Days,
  getAllShowtimesForNext14Days,
  createShowtime as createShowtimeAPI,
  updateShowtime as updateShowtimeAPI,
  deleteShowtime as deleteShowtimeAPI,
  getAllRooms as getAllRoomsAPI,
  generateOptimalSchedule as autoScheduleAPI
} from '../services/ShowtimeService';
import { getMovieById } from '../services/MovieService';

export function useShowtimes(movieId) {
  const [movie, setMovie] = useState({});
  const [showtimes, setShowtimes] = useState([]);
  const [filteredShowtimes, setFilteredShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emptyMessage, setEmptyMessage] = useState('');

  // --- Hàm tiện ích format ngày ---
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // --- Lấy danh sách phòng ---
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getAllRoomsAPI();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  // --- Lấy dữ liệu showtime khi movieId thay đổi ---
  useEffect(() => {
    fetchInitialData();
  }, [movieId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!movieId) {
        // Nếu không chọn phim => lấy tất cả showtime 14 ngày tới
        const data = await getAllShowtimesForNext14Days().catch(() => []);
        const validShowtimes = Array.isArray(data) ? data : [];

        setMovie({});
        setShowtimes(validShowtimes);
        setFilteredShowtimes(validShowtimes);
        setSelectedDate(null);
        setEmptyMessage(validShowtimes.length === 0 ? 'Chưa có suất chiếu nào trong 14 ngày tới.' : '');
      } else {
        // Nếu chọn phim => lấy thông tin phim + 7 ngày showtime
        const [movieData, showtimeData] = await Promise.all([
          getMovieById(movieId).catch(() => ({})),
          getShowtimesForNext7Days(movieId).catch(() => [])
        ]);

        setMovie(movieData || {});
        const validShowtimes = Array.isArray(showtimeData) ? showtimeData : [];
        setShowtimes(validShowtimes);

        if (validShowtimes.length > 0) {
          const todayStr = formatDate(new Date());
          setSelectedDate(todayStr);

          const filtered = validShowtimes.filter(st => formatDate(st.startTime) === todayStr);
          setFilteredShowtimes(filtered);
          setEmptyMessage('');
        } else {
          setFilteredShowtimes([]);
          setEmptyMessage('Không có suất chiếu nào trong 7 ngày tới cho phim này.');
        }
      }
    } catch (err) {
      console.error('Error fetching showtimes:', err);
      setMovie({});
      setShowtimes([]);
      setFilteredShowtimes([]);
      setError('Không thể tải danh sách suất chiếu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- Lọc theo ngày ---
  const handleDateSelect = (date) => {
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);

    const filtered = showtimes.filter(st => formatDate(st.startTime) === dateStr);
    if (filtered.length > 0) {
      setFilteredShowtimes(filtered);
      setEmptyMessage('');
    } else {
      setFilteredShowtimes([]);
      setEmptyMessage('Không có suất chiếu nào cho ngày này.');
    }
  };

  // --- Lấy danh sách showtime theo movieId ---
  const fetchShowtimes = useCallback(async (targetMovieId) => {
    try {
      setLoading(true);
      setError(null);

      if (!targetMovieId) {
        const data = await getAllShowtimesForNext14Days();
        const validShowtimes = Array.isArray(data) ? data : [];
        setShowtimes(validShowtimes);
        setFilteredShowtimes(validShowtimes);
        setSelectedDate(null);
        setEmptyMessage(validShowtimes.length === 0 ? 'Chưa có suất chiếu nào.' : '');
      } else {
        const data = await getShowtimesForNext7Days(targetMovieId);
        const validShowtimes = Array.isArray(data) ? data : [];
        setShowtimes(validShowtimes);

        if (selectedDate) {
          const filtered = validShowtimes.filter(st => formatDate(st.startTime) === selectedDate);
          setFilteredShowtimes(filtered);
        } else {
          setFilteredShowtimes(validShowtimes);
        }

        setEmptyMessage(validShowtimes.length === 0 ? 'Không có suất chiếu nào.' : '');
      }
    } catch (err) {
      console.error('Error fetching showtimes:', err);
      setError(err.response?.data || err.message);
      setShowtimes([]);
      setFilteredShowtimes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // --- CRUD Showtimes ---
  const createShowtime = useCallback(async (showtimeData) => {
    try {
      setLoading(true);
      setError(null);
      const created = await createShowtimeAPI(showtimeData);
      await fetchShowtimes(showtimeData.movieId || movieId);
      return created;
    } catch (err) {
      console.error('Error creating showtime:', err);
      const errorMsg = err.response?.data || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [movieId, fetchShowtimes]);

  const updateShowtime = useCallback(async (showtimeId, showtimeData, targetMovieId) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await updateShowtimeAPI(showtimeId, showtimeData);
      const id = targetMovieId || movieId;
      await fetchShowtimes(id);
      return updated;
    } catch (err) {
      console.error('Error updating showtime:', err);
      const errorMsg = err.response?.data || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [movieId, fetchShowtimes]);

  const deleteShowtime = useCallback(async (showtimeId, targetMovieId) => {
    try {
      setLoading(true);
      setError(null);
      await deleteShowtimeAPI(showtimeId);
      const id = targetMovieId || movieId;
      await fetchShowtimes(id);
    } catch (err) {
      console.error('Error deleting showtime:', err);
      const errorMsg = err.response?.data || err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [movieId, fetchShowtimes]);

  // --- Lập lịch tự động (auto schedule) ---
  const autoSchedule = useCallback(
    //async ({ roomId, date, movieIds = [], occupancyRate }) => {
    async ({ roomId, date, movieIds = [] }) => {
      try {
        setLoading(true);
        //const generated = await autoScheduleAPI({ roomId, date, movieIds, occupancyRate });
        const generated = await autoScheduleAPI({ roomId, date, movieIds });
        // Refresh showtimes sau khi generate
        await fetchShowtimes(movieId);
        return generated;
      } catch (err) {
        console.error("Error generating auto schedule:", err);
        setError("Không thể tạo lịch tự động.");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [fetchShowtimes, movieId]
  );

  return {
    movie,
    showtimes,
    filteredShowtimes,
    rooms,
    selectedDate,
    loading,
    error,
    emptyMessage,
    formatDate,
    handleDateSelect,
    fetchShowtimes,
    createShowtime,
    updateShowtime,
    deleteShowtime,
    refreshRooms: loadRooms,
    autoSchedule
  };
}
