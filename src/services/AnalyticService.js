import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/analytics';

const analyticsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export async function getOccupancyByShowtimes(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/occupancy/showtimes', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy by showtimes:', error);
    throw error;
  }
}

export async function getOccupancyByRooms(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/occupancy/rooms', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy by rooms:', error);
    throw error;
  }
}

export async function getOccupancyByTimeslots(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/occupancy/timeslots', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy by timeslots:', error);
    throw error;
  }
}

export async function getOccupancyAnalysis(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/occupancy/analysis', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy analysis:', error);
    throw error;
  }
}

export async function getGenreStatistics(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/genres', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching genre statistics:', error);
    throw error;
  }
}

export async function getTopMoviesByGenre(startDate, endDate, topN = 3) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      top_n: topN,
    };
    const response = await analyticsApi.get('/genres/top-movies', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching top movies by genre:', error);
    throw error;
  }
}

export async function getGenreAnalysis(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/genres/analysis', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching genre analysis:', error);
    throw error;
  }
}

export async function getMovieRevenue(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/revenue/movies', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching movie revenue:', error);
    throw error;
  }
}

export async function getDailyRevenue(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/revenue/daily', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    throw error;
  }
}

export async function getRevenueAnalysis(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/revenue/analysis', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue analysis:', error);
    throw error;
  }
}

export async function getDashboardOverview(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/dashboard/overview', { params });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
}

export async function getDashboardTimeseries(startDate, endDate) {
  try {
    const params = {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    };
    const response = await analyticsApi.get('/dashboard/timeseries', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard timeseries:', error);
    throw error;
  }
}

export default {
  getOccupancyByShowtimes,
  getOccupancyByRooms,
  getOccupancyByTimeslots,
  getOccupancyAnalysis,
  getGenreStatistics,
  getTopMoviesByGenre,
  getGenreAnalysis,
  getMovieRevenue,
  getDailyRevenue,
  getRevenueAnalysis,
  getDashboardOverview,
  getDashboardTimeseries,
};