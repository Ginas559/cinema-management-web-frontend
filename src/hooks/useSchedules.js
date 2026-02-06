import { useState, useEffect, useCallback } from "react";
import {
  getSchedule,
  createSchedule as createScheduleAPI,
  registerShift as registerShiftAPI,
  assignShift as assignShiftAPI,
  cancelShift as cancelShiftAPI,
  autoAssignShifts as autoAssignShiftsAPI,
  getCurrentMonday,
  getCreatedWeeks,
  getMyRegisteredShifts as getMyRegisteredShiftsAPI,
  deleteWeek as deleteWeekAPI,
} from "../services/ScheduleService";

export function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [createdWeeks, setCreatedWeeks] = useState([]);
  const [userRole, setUserRole] = useState("STAFF");

  // Load user role từ storage
  useEffect(() => {
    try {
      const role = localStorage.getItem("role") || sessionStorage.getItem("role");
      if (role) setUserRole(role);
    } catch (err) {
      console.warn("Unable to load user role:", err);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const [monday, weeks] = await Promise.all([
          getCurrentMonday(),
          getCreatedWeeks(),
        ]);
        setCurrentWeekStart(monday);
        setCreatedWeeks(weeks);
      } catch (err) {
        console.error("Failed to initialize schedule data:", err);
        setError(err.message || "Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  const loadSchedule = useCallback(async (startDate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchedule(startDate);
      setSchedules(data);
      setCurrentWeekStart(startDate);
    } catch (err) {
      console.error("Error loading schedule:", err);
      setError(err.message || "Failed to load schedule");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (startDate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createScheduleAPI(startDate);
      setSchedules(data);
      setCurrentWeekStart(startDate);
      
      if (!createdWeeks.includes(startDate)) {
        setCreatedWeeks((prev) => [...prev, startDate].sort());
      }
      
      return data;
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError(err.message || "Failed to create schedule");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [createdWeeks]);

  const registerShift = useCallback(async (shiftId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerShiftAPI(shiftId);
      
      if (currentWeekStart) {
        await loadSchedule(currentWeekStart);
      }
      
      return result;
    } catch (err) {
      console.error("Error registering shift:", err);
      setError(err.message || "Failed to register for shift");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, loadSchedule]);

  const getMyRegisteredShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyRegisteredShiftsAPI();
      return result;
    } catch (err) {
      console.error("Error getting registered shifts:", err);
      setError(err.message || "Failed to get registered shifts");
      throw err;
    } finally {
      setLoading(false);
    }
  })

  const assignShift = useCallback(async (employeeId, shiftId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await assignShiftAPI(employeeId, shiftId);

      if (currentWeekStart) {
        await loadSchedule(currentWeekStart);
      }
      
      return result;
    } catch (err) {
      console.error("Error assigning shift:", err);
      setError(err.message || "Failed to assign employee");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, loadSchedule]);

  const cancelShift = useCallback(async (registrationId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cancelShiftAPI(registrationId);

      if (currentWeekStart) {
        await loadSchedule(currentWeekStart);
      }
      
      return result;
    } catch (err) {
      console.error("Error canceling shift:", err);
      setError(err.message || "Failed to cancel shift");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, loadSchedule]);

  const autoAssignShifts = useCallback(async (startDate) => {
    setLoading(true);
    setError(null);
    try {
      const result = await autoAssignShiftsAPI(startDate);

      if (startDate === currentWeekStart) {
        await loadSchedule(startDate);
      }
      
      return result;
    } catch (err) {
      console.error("Error auto-assigning shifts:", err);
      setError(err.message || "Failed to auto-assign shifts");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, loadSchedule]);

  const deleteWeek = useCallback(async (startDate) => {
    setLoading(true);
    setError(null);
    try {
      await deleteWeekAPI(startDate);
      
      setCreatedWeeks((prev) => prev.filter((d) => d !== startDate));
      
      if (currentWeekStart === startDate) {
        setSchedules([]);
      }
      
      return true;
    } catch (err) {
      console.error("Error deleting week:", err);
      setError(err.message || "Failed to delete week");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  return {
    schedules,
    loading,
    error,
    currentWeekStart,
    createdWeeks,
    userRole,
    loadSchedule,
    createSchedule,
    registerShift,
    assignShift,
    cancelShift,
    autoAssignShifts,
    getMyRegisteredShifts,
    deleteWeek,
  };
}