    import { useState, useEffect, useCallback } from 'react';
    import {
    getOccupancyByRooms,
    getOccupancyByShowtimes,
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
    } from '../services/AnalyticService';

    export const useAnalytics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleApiCall = useCallback(async (apiFunc, ...args) => {
        setLoading(true);
        setError(null);
        try {
        const data = await apiFunc(...args);
        return data;
        } catch (err) {
        setError(err.message || 'An error occurred');
        throw err;
        } finally {
        setLoading(false);
        }
    }, []);

    return { loading, error, handleApiCall };
    };

    export const useDashboard = (startDate, endDate) => {
    const [overview, setOverview] = useState(null);
    const [timeseries, setTimeseries] = useState([]);
    const { loading, error, handleApiCall } = useAnalytics();

    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) return;
        try {
        const [overviewRes, timeseriesRes ] = await Promise.all([
            handleApiCall(getDashboardOverview, startDate, endDate),
            handleApiCall(getDashboardTimeseries, startDate, endDate),
        ]);
        setOverview(overviewRes || null);
        setTimeseries(timeseriesRes?.data || []);
        } catch (err) {
        console.error('Error fetching dashboard data:', err);
        }
    }, [startDate, endDate, handleApiCall]);

    useEffect(() => {

        fetchData();
    }, [fetchData]);

    return { overview, timeseries, loading, error, refetch: fetchData };
    };

    export const useOccupancy = (startDate, endDate) => {
    const [showtimes, setShowtimes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [timeslots, setTimeslots] = useState([]);
    const [analysis, setAnalysis] = useState([]);
    const { loading, error, handleApiCall } = useAnalytics();

    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) return;
        try {
        const [
            showtimesRes,
            roomsRes,
            timeslotsRes,
            analysisRes
        ] = await Promise.all([
            handleApiCall(getOccupancyByShowtimes, startDate, endDate),
            handleApiCall(getOccupancyByRooms, startDate, endDate),
            handleApiCall(getOccupancyByTimeslots, startDate, endDate),
            handleApiCall(getOccupancyAnalysis, startDate, endDate)
        ]);
        setShowtimes(showtimesRes?.data || []);
        setRooms(roomsRes?.data || []);
        setTimeslots(timeslotsRes?.data || []);
        setAnalysis(analysisRes?.data || []);
        } catch (err) {
        console.error('Error fetching occupancy:', err);
        }
    }, [startDate, endDate, handleApiCall]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { showtimes, rooms, timeslots, analysis, loading, error, refetch: fetchData };
    };

    export const useGenres = (startDate, endDate, topN = 3) => {
    const [statistics, setStatistics] = useState([]);
    const [topMovies, setTopMovies] = useState([]);
    const [analysis, setAnalysis] = useState([]);
    const { loading, error, handleApiCall } = useAnalytics();

    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) return;
        try {
        const [statsRes, topRes, analysisRes] = await Promise.all([
            handleApiCall(getGenreStatistics, startDate, endDate),
            handleApiCall(getTopMoviesByGenre, startDate, endDate, topN),
            handleApiCall(getGenreAnalysis, startDate, endDate)
        ]);
        setStatistics(statsRes?.data || []);
        setTopMovies(topRes?.data || []);
        setAnalysis(analysisRes?.data || []);
        } catch (err) {
        console.error('Error fetching genre statistics:', err);
        }
    }, [startDate, endDate, topN, handleApiCall]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statistics, topMovies, analysis, loading, error, refetch: fetchData };
    };

    export const useRevenue = (startDate, endDate) => {
    const [movies, setMovies] = useState([]);
    const [daily, setDaily] = useState([]);
    const [analysis, setAnalysis] = useState([]);
    const { loading, error, handleApiCall } = useAnalytics();

    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) return;
        try {
        const [movieRes, dailyRes, analysisRes] = await Promise.all([
            handleApiCall(getMovieRevenue, startDate, endDate),
            handleApiCall(getDailyRevenue, startDate, endDate),
            handleApiCall(getRevenueAnalysis, startDate, endDate)
        ]);
        setMovies(movieRes?.data || []);
        setDaily(dailyRes?.data || []);
        setAnalysis(analysisRes?.data || []);
        } catch (err) {
        console.error('Error fetching revenue:', err);
        }
    }, [startDate, endDate, handleApiCall]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { movies, daily, analysis, loading, error, refetch: fetchData };
    };
