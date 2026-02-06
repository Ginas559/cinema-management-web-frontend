import api from "./api";

export const getCurrentMonday = async () => {
  const res = await api.get("/api/shifts/current-monday");
  return res.data.currentMonday; 
};

export const getCreatedWeeks = async () => {
  const res = await api.get("/api/shifts/created-weeks");
  return res.data;
};

export const getSchedule = async (startDate) => {
  const res = await api.get("/api/shifts/schedule/week", {
    params: { startDate },
  });
  return res.data;
};

export const createSchedule = async (startDate) => {
  const res = await api.post("/api/shifts/schedule", null, {
    params: { startDate },
  });
  return res.data;
};

export const deleteWeek = async (startDate) => {
  if (!startDate) throw new Error("startDate is required");
  const res = await api.delete("/api/shifts/schedule", {
    params: { startDate },
  });
  return res.data;
};

export const registerShift = async (shiftId) => {
  const res = await api.post("/api/shifts/register", { shiftId });
  return res.data;
};

export const assignShift = async (employeeId, shiftId) => {
  const res = await api.post("/api/shifts/assign", {
    employeeId,
    shiftId,
  });
  return res.data;
};

export const cancelShift = async (shiftId) => {
  if (!shiftId) throw new Error("shiftId is required");
  const res = await api.delete("/api/shifts/cancel-self", {
    params: { shiftId },
  });
  return res.data;
};

export const autoAssignShifts = async (startDate) => {
  const res = await api.post("/api/shifts/auto-assign", null, {
    params: { startDate },
  });
  return res.data;
};

export const getEmployeeShiftCount = async (startDate) => {
  const res = await api.get("/api/schedule/employee-shift-counts", {
    params: { startDate },
  });
  return res.data;
};

export const getMyRegisteredShifts = async () => {
  const res = await api.get("/api/shifts/registered");
  return res.data;
};
