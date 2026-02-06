import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSchedules } from "../hooks/useSchedules";
import { AssignStaff } from "../components/modals/operation/AssignStaff";
import { ScheduleSidebar } from "../components/modals/operation/ScheduleSidebar";
import { getMyRegisteredShifts as getMyRegisteredShiftsAPI } from "../services/ScheduleService";
import "../styles/schedule.css";
import {
  Calendar,
  Trash2,
  Bot,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  UserPlus,
  UserMinus,
} from "lucide-react";

/* ============= Toast Component ============= */
function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  
  const icons = {
    success: CheckCircle2,
    error: X,
    warning: AlertTriangle,
  };
  const Icon = icons[type] || CheckCircle2;
  
  return (
    <div className={`toast toast-${type}`}>
      <Icon size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">
        <X size={18} />
      </button>
    </div>
  );
}

/* ============= Generic Confirm Modal ============= */
function ConfirmModal({ open, title, message, confirmText = "Confirm", variant = "warning", onConfirm, onCancel }) {
  if (!open) return null;
  
  return (
    <div className="shift-schedule-modal-overlay" onClick={onCancel}>
      <div className="shift-schedule-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="shift-schedule-modal-header">{title}</h2>
        <div className="shift-schedule-modal-body">
          <div className={`alert alert-${variant}`}>
            <p>{message}</p>
          </div>
        </div>
        <div className="shift-schedule-modal-actions">
          <button className="shift-schedule-btn shift-schedule-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="shift-schedule-btn shift-schedule-btn-warning" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============= Helper Functions ============= */
const DATE_RE = /(\d{4}-\d{2}-\d{2})/;

const extractDateFromName = (name) => name ? (String(name).match(DATE_RE)?.[1] || "") : "";

const safeWorkDate = (shift) => shift?.workDate || extractDateFromName(shift?.name) || "";

const fmtDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]}, ${d.toLocaleDateString()}`;
};

const fmtTime = (t) => {
  if (!t) return "";
  const parts = String(t).split(":");
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
};

const isWeekendDate = (dateStr) => {
  if (!dateStr) return false;
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
};

const getMondayOfWeek = (dateStr) => {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday.toISOString().split("T")[0];
};

const mapAxiosError = (err, mondayHint, action) => {
  const st = err?.response?.status;
  const rawMsg = err?.response?.data?.message || err?.response?.data?.error || "";
  const msg = String(rawMsg).toLowerCase();

  const errorMap = {
    "already registered": "You have already registered for this shift.",
    "already assigned": "Employee is already assigned to this shift.",
    "start date must be monday": `Start date must be a MONDAY (YYYY-MM-DD). Try: ${mondayHint || "select Monday"}.`,
    "no shifts found": "No shifts found for this week.",
    "shift not found": "Shift not found.",
    "employee not found": "Employee not found.",
    "registration not found": "Registration not found or already cancelled.",
    "weekly shift limit exceeded": "Weekly shift limit exceeded (max 6 shifts).",
    "weekly hour limit exceeded": "Weekly hour limit exceeded (max 40 hours).",
    "shift time conflict": "This shift conflicts with another registered shift.",
    "not enough rest time": "Need at least 12 hours rest between shifts.",
    "consecutive day limit exceeded": "Max 5 consecutive working days exceeded.",
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (msg.includes(key)) return value;
  }

  const statusMap = {
    400: "Bad request. Please check your input.",
    401: "Session expired. Please log in again.",
    403: "You don't have permission to perform this action.",
    404: "Week not found. Please create the week first.",
    409: "Conflict: Week/Shift already exists or is full.",
  };

  return statusMap[st] || err?.message || "Unable to connect to server. Please try again.";
};

/* ============= Custom Hook for Modal Management ============= */
const useModal = () => {
  const [modals, setModals] = useState({
    assign: false,
    autoAssign: false,
    delete: false,
    register: false,
    cancel: false,
    autoAssignConfirm: false,
  });
  const [data, setData] = useState({
    shiftId: null,
    shift: null,
    date: "",
    monday: "",
  });

  const open = useCallback((name, modalData = {}) => {
    setModals(prev => ({ ...prev, [name]: true }));
    setData(prev => ({ ...prev, ...modalData }));
  }, []);

  const close = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: false }));
    if (name === 'assign') setData(prev => ({ ...prev, shift: null }));
  }, []);

  return { modals, data, open, close, setData };
};

/* ============= Main Component ============= */
export function Schedule() {
  const navigate = useNavigate();
  const {
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
    deleteWeek,
  } = useSchedules();

  const [selectedDate, setSelectedDate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [myRegisteredShifts, setMyRegisteredShifts] = useState([]);
  
  const { modals, data, open, close, setData } = useModal();

  const showToast = useCallback((message, type = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const canManage = userRole === "ADMIN" || userRole === "MANAGER";

  // Fetch registered shifts
  useEffect(() => {
    if (userRole === "STAFF" || userRole === "MANAGER") {
      getMyRegisteredShiftsAPI()
        .then((result) => setMyRegisteredShifts(Array.isArray(result) ? result : []))
        .catch(() => setMyRegisteredShifts([]));
    }
  }, [userRole, schedules]);

  // Process and group schedules
  const groupedShifts = useMemo(() => {
    const safeSchedules = Array.isArray(schedules) ? schedules : [];
    const normalized = safeSchedules.map((s) => ({
      ...s,
      _workDate: safeWorkDate(s),
    }));

    return normalized.reduce((acc, shift) => {
      const date = shift._workDate || "(unknown)";
      if (!acc[date]) acc[date] = [];
      acc[date].push(shift);
      return acc;
    }, {});
  }, [schedules]);

  const sortedDates = useMemo(() => 
    Object.keys(groupedShifts).sort((a, b) => {
      if (a === "(unknown)" && b === "(unknown)") return 0;
      if (a === "(unknown)") return 1;
      if (b === "(unknown)") return -1;
      return new Date(a) - new Date(b);
    }), [groupedShifts]
  );

  // Generic action handler
  const handleAction = useCallback(async (action, errorContext, onSuccess) => {
    try {
      const result = await action();
      onSuccess(result);
    } catch (err) {
      showToast(mapAxiosError(err, errorContext.monday, errorContext.action), "error");
    }
  }, [showToast]);

  // Week operations
  const handleLoadWeek = useCallback(() => {
    if (!selectedDate) return;
    const monday = getMondayOfWeek(selectedDate);
    if (selectedDate !== monday) setSelectedDate(monday);
    handleAction(
      () => loadSchedule(monday),
      { monday, action: "load" },
      () => {}
    );
  }, [selectedDate, loadSchedule, handleAction]);

  const handleWeekSelect = useCallback((monday) => {
    handleAction(
      () => loadSchedule(monday),
      { monday, action: "load" },
      () => setSidebarOpen(false)
    );
  }, [loadSchedule, handleAction]);

  const handleCreateWeek = useCallback(() => {
    if (!selectedDate || !canManage) {
      showToast(canManage ? "Please select a date." : "Only MANAGER/ADMIN can create a week.", "warning");
      return;
    }
    const monday = getMondayOfWeek(selectedDate);
    if (selectedDate !== monday) setSelectedDate(monday);
    handleAction(
      () => createSchedule(monday),
      { monday, action: "create" },
      () => showToast("Schedule created successfully!", "success")
    );
  }, [selectedDate, canManage, createSchedule, handleAction, showToast]);

  const handleDeleteWeek = useCallback(() => {
    if (!canManage || !selectedDate) {
      showToast(!canManage ? "Only MANAGER/ADMIN can delete a week." : "Please select a date.", "warning");
      return;
    }
    const monday = getMondayOfWeek(selectedDate);
    if (selectedDate !== monday) {
      showToast(`Delete works only on MONDAY. Try: ${monday}`, "warning");
      return;
    }
    open('delete');
  }, [canManage, selectedDate, showToast, open]);

  const confirmDeleteWeek = useCallback(async () => {
    const monday = selectedDate;
    close('delete');
    await handleAction(
      () => deleteWeek(monday),
      { monday, action: "delete" },
      async () => {
        showToast(`Week ${monday} deleted successfully!`, "success");
        try { await loadSchedule(monday); } catch {}
      }
    );
  }, [selectedDate, deleteWeek, handleAction, showToast, loadSchedule, close]);

  // Shift operations
  const confirmRegister = useCallback(async () => {
    close('register');
    await handleAction(
      () => registerShift(data.shiftId),
      { action: "register" },
      () => showToast("Successfully registered for shift!", "success")
    );
  }, [data.shiftId, registerShift, handleAction, showToast, close]);

  const confirmCancel = useCallback(async () => {
    close('cancel');
    await handleAction(
      () => cancelShift(data.shiftId),
      { action: "cancel" },
      () => showToast("Shift cancelled successfully!", "success")
    );
  }, [data.shiftId, cancelShift, handleAction, showToast, close]);

  const confirmAutoAssign = useCallback(async () => {
    close('autoAssignConfirm');
    await handleAction(
      () => autoAssignShifts(data.monday),
      { monday: data.monday, action: "auto-assign" },
      (result) => {
        showToast(`Auto-assigned ${result.assignedCount} shifts for week ${data.monday}!`, "success");
        close('autoAssign');
      }
    );
  }, [data.monday, autoAssignShifts, handleAction, showToast, close]);

  const handleAutoAssignSubmit = useCallback(() => {
    if (!data.date) {
      showToast("Please select a date.", "warning");
      return;
    }
    const monday = getMondayOfWeek(data.date);
    setData(prev => ({ ...prev, monday }));
    open('autoAssignConfirm');
  }, [data.date, showToast, open, setData]);

  const handleAssignEmployee = useCallback(async (employeeId, shiftId) => {
    await handleAction(
      () => assignShift(employeeId, shiftId),
      { action: "assign" },
      () => {
        showToast("Employee assigned to shift successfully!", "success");
        close('assign');
      }
    );
  }, [assignShift, handleAction, showToast, close]);

  /* ============= Render ============= */
  return (
    <div className="schedule-main-container">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <ScheduleSidebar
        createdWeeks={createdWeeks}
        currentWeekStart={currentWeekStart}
        onWeekSelect={handleWeekSelect}
        loading={loading}
      />

      <button
        className="schedule-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle calendar sidebar"
        title="Toggle calendar sidebar"
      >
        <Calendar />
      </button>

      <div className="shift-schedule-container">
        <div className="shift-schedule-header">
          <h1 className="shift-schedule-title">
            Work Schedule
            <span className={`shift-schedule-role-badge ${userRole.toLowerCase()}`}>{userRole}</span>
          </h1>
          <p className="shift-schedule-subtitle">Current Week: {currentWeekStart || "Loading..."}</p>

          <div className="shift-schedule-controls">
            <div className="shift-schedule-week-selector">
              <label>Select Monday:</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              <button
                className="shift-schedule-btn shift-schedule-btn-primary shift-schedule-btn-small"
                onClick={handleLoadWeek}
                disabled={!selectedDate}
              >
                Load Week
              </button>
              <button
                className="shift-schedule-btn shift-schedule-btn-success shift-schedule-btn-small"
                onClick={handleCreateWeek}
                disabled={!selectedDate || loading || !canManage}
                title={canManage ? "Create schedule for the week" : "Only MANAGER/ADMIN can create weeks"}
              >
                Create Week
              </button>

              {canManage && (
                <button
                  className="shift-schedule-btn shift-schedule-btn-secondary shift-schedule-btn-small"
                  onClick={handleDeleteWeek}
                  disabled={!selectedDate || loading}
                  title="Delete the selected week (Monday only)"
                >
                  <Trash2 /> Delete Week
                </button>
              )}
            </div>

            {canManage && (
              <button
                className="shift-schedule-btn shift-schedule-btn-warning"
                onClick={() => open('autoAssign', { date: "" })}
                disabled={loading}
                title="Auto assign available employees to shifts"
              >
                <Bot /> Auto Assign Shifts
              </button>
            )}

            {userRole === "STAFF" && (
              <button
                className="shift-schedule-btn shift-schedule-btn-secondary"
                onClick={() => navigate("/my-shifts")}
                title="View my registered shifts timeline"
              >
                📅 View My Shifts
              </button>
            )}
          </div>

          {error && !/status code \d+/.test(error) && <div className="shift-schedule-error-message">{error}</div>}
        </div>

        {loading ? (
          <div className="shift-schedule-loading-container">
            <div className="shift-schedule-loading-spinner"></div>
            <p>Loading schedule...</p>
          </div>
        ) : Object.keys(groupedShifts).length === 0 ? (
          <div className="shift-schedule-empty-state">
            <div className="shift-schedule-empty-state-icon">
              <Calendar />
            </div>
            <h2>No schedule found</h2>
            <p>Please select a Monday date and create a schedule</p>
          </div>
        ) : (
          <div className="shift-schedule-grid">
            {sortedDates.map((dateKey) => (
              <div key={dateKey} className="shift-schedule-day-section">
                <div className="shift-schedule-day-header">
                  <div>
                    <h2 className="shift-schedule-day-title">{fmtDate(dateKey) || "(unknown date)"}</h2>
                    <p className="shift-schedule-day-date">{dateKey || ""}</p>
                  </div>
                  {dateKey && isWeekendDate(dateKey) && <span className="shift-schedule-weekend-badge">Weekend</span>}
                </div>

                <div className="shift-schedule-shifts-list">
                  {groupedShifts[dateKey].map((shift) => {
                    const isRegistered = myRegisteredShifts.some((rs) => rs.shiftId === shift.shiftId);
                    const isFull = shift.shiftStatus === "FULL";
                    
                    return (
                      <div key={shift.shiftId} className="shift-schedule-shift-card">
                        <div className="shift-schedule-shift-header">
                          <div>
                            <h3 className="shift-schedule-shift-name">{shift.name}</h3>
                            <p className="shift-schedule-shift-time">
                              <Clock size={14} />
                              {fmtTime(shift.startTime)} - {fmtTime(shift.endTime)}
                            </p>
                            <p className="shift-schedule-shift-details">
                              <FileText size={14} />
                              {shift.note || "No additional notes"}
                            </p>
                            {shift.registeredCount !== undefined && (
                              <p className="shift-schedule-shift-details">
                                <Users size={14} />
                                Registered: {shift.registeredCount} / {shift.requiredStaff || "N/A"}
                              </p>
                            )}
                          </div>
                          <span className={`shift-schedule-shift-status ${String(shift.shiftStatus || "").toLowerCase()}`}>
                            {shift.shiftStatus || "UNKNOWN"}
                          </span>
                        </div>

                        <div className="shift-schedule-shift-actions">
                          {(userRole === "STAFF" || userRole === "MANAGER") && (
                            <>
                              {!isRegistered ? (
                                <button
                                  className="shift-schedule-btn shift-schedule-btn-primary shift-schedule-btn-small"
                                  onClick={() => open('register', { shiftId: shift.shiftId })}
                                  disabled={loading || isFull}
                                >
                                  <UserPlus size={14} />
                                  {userRole === "MANAGER" ? "Register Self" : "Register"}
                                </button>
                              ) : (
                                <button
                                  className="shift-schedule-btn shift-schedule-btn-warning shift-schedule-btn-small"
                                  onClick={() => open('cancel', { shiftId: shift.shiftId })}
                                  disabled={loading}
                                  title="Cancel your registration"
                                >
                                  <UserMinus size={14} />
                                  Cancel
                                </button>
                              )}
                            </>
                          )}

                          {userRole === "MANAGER" && (
                            <button
                              className="shift-schedule-btn shift-schedule-btn-success shift-schedule-btn-small"
                              onClick={() => open('assign', { shift })}
                              disabled={loading || isFull}
                            >
                              <Users size={14} />
                              Assign Employee
                            </button>
                          )}

                          {isFull && (
                            <span className="shift-full-badge">
                              <CheckCircle2 size={14} />
                              Shift is full
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <AssignStaff
          isOpen={modals.assign}
          onClose={() => close('assign')}
          shift={data.shift}
          onAssign={handleAssignEmployee}
          isLoading={loading}
          weekStart={currentWeekStart}
        />

        {modals.autoAssign && (
          <div className="shift-schedule-modal-overlay" onClick={() => close('autoAssign')}>
            <div className="shift-schedule-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="shift-schedule-modal-header">
                <Bot /> Auto Assign Shifts
              </h2>

              <div className="shift-schedule-modal-body">
                <div className="shift-schedule-form-group">
                  <label>Select any date in the target week: *</label>
                  <input
                    type="date"
                    placeholder="Select a date"
                    value={data.date}
                    onChange={(e) => setData(prev => ({ ...prev, date: e.target.value }))}
                    autoFocus
                  />
                  <small>The system will automatically target the Monday of the selected week</small>
                </div>

                {data.date && (
                  <div className="alert alert-info">
                    <label>
                      <Calendar size={14} />
                      Target Week Start (Monday):
                    </label>
                    <div className="monday-display">{getMondayOfWeek(data.date)}</div>
                  </div>
                )}

                <div className="alert alert-warning">
                  <p>
                    <AlertTriangle size={14} />
                    <strong>Note:</strong> This will automatically assign available employees to all shifts in the
                    selected week based on availability and working-hour limits.
                  </p>
                </div>
              </div>

              <div className="shift-schedule-modal-actions">
                <button
                  className="shift-schedule-btn shift-schedule-btn-secondary"
                  onClick={() => close('autoAssign')}
                >
                  Cancel
                </button>
                <button
                  className="shift-schedule-btn shift-schedule-btn-warning"
                  onClick={handleAutoAssignSubmit}
                  disabled={!data.date || loading}
                >
                  <Bot size={14} />
                  Auto Assign
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={modals.delete}
          title={<><Trash2 /> Delete Week</>}
          message={`You are about to delete the entire week starting ${selectedDate}. This action cannot be undone. Please confirm to proceed.`}
          confirmText="Delete"
          variant="danger"
          onConfirm={confirmDeleteWeek}
          onCancel={() => close('delete')}
        />

        <ConfirmModal
          open={modals.register}
          title={<><UserPlus /> Confirm Registration</>}
          message="Are you sure you want to register for this shift?"
          confirmText="Register"
          variant="warning"
          onConfirm={confirmRegister}
          onCancel={() => close('register')}
        />

        <ConfirmModal
          open={modals.cancel}
          title={<><UserMinus /> Cancel Registration</>}
          message="Are you sure you want to cancel your registration for this shift? This action cannot be undone."
          confirmText="Yes, Cancel"
          variant="danger"
          onConfirm={confirmCancel}
          onCancel={() => close('cancel')}
        />

        <ConfirmModal
          open={modals.autoAssignConfirm}
          title={<><Bot /> Confirm Auto-Assign</>}
          message={`The system will auto-assign employees for the week starting ${data.monday}. Proceed?`}
          confirmText="Run Auto-Assign"
          variant="warning"
          onConfirm={confirmAutoAssign}
          onCancel={() => close('autoAssignConfirm')}
        />
      </div>
    </div>
  );
}

export default Schedule;