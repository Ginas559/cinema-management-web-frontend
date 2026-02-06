import React from "react";
import "../../../styles/schedule-sidebar.css";
export function ScheduleSidebar({ 
  createdWeeks, 
  currentWeekStart, 
  onWeekSelect, 
  loading 
}) {
  const formatWeekDisplay = (monday) => {
    const date = new Date(monday);
    const sunday = new Date(date);
    sunday.setDate(date.getDate() + 6);
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return {
      weekLabel: `Week ${getWeekNumber(date)}`,
      dateRange: `${monthNames[date.getMonth()]} ${date.getDate()} - ${monthNames[sunday.getMonth()]} ${sunday.getDate()}`,
      year: date.getFullYear(),
      monday: monday
    };
  };

  const getWeekNumber = (date) => {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil((((date - onejan) / millisecsInDay) + onejan.getDay() + 1) / 7);
  };

  const isCurrentWeek = (monday) => {
    return monday === currentWeekStart;
  };

  const sortedWeeks = [...createdWeeks].sort((a, b) => {
    return new Date(b) - new Date(a); // Newest first
  });

  return (
    <div className="schedule-sidebar">
      <div className="schedule-sidebar-header">
        <h3>📅 Created Weeks</h3>
        <span className="schedule-sidebar-count">{createdWeeks.length}</span>
      </div>

      <div className="schedule-sidebar-content">
        {loading ? (
          <div className="schedule-sidebar-loading">
            <div className="schedule-sidebar-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : createdWeeks.length === 0 ? (
          <div className="schedule-sidebar-empty">
            <p>📭 No weeks created yet</p>
            <small>Create a schedule to get started</small>
          </div>
        ) : (
          <div className="schedule-sidebar-list">
            {sortedWeeks.map((monday) => {
              const weekInfo = formatWeekDisplay(monday);
              const isCurrent = isCurrentWeek(monday);
              
              return (
                <div
                  key={monday}
                  className={`schedule-sidebar-item ${isCurrent ? "active" : ""}`}
                  onClick={() => onWeekSelect(monday)}
                >
                  <div className="schedule-sidebar-item-header">
                    <span className="schedule-sidebar-week-label">
                      {weekInfo.weekLabel}
                    </span>
                    {isCurrent && (
                      <span className="schedule-sidebar-current-badge">Current</span>
                    )}
                  </div>
                  <div className="schedule-sidebar-item-date">
                    {weekInfo.dateRange}
                  </div>
                  <div className="schedule-sidebar-item-year">
                    {weekInfo.year}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}