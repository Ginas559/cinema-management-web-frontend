import { useState, useCallback, useEffect, useMemo } from "react";
import { useShowtimes } from "../../../hooks/useShowtimes";
import "../../../styles/showtime-management.css";

export function ShowtimeManagement({ movies }) {
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState("timeline"); // timeline | table
  
  const {
    showtimes,
    rooms,
    loading,
    error,
    fetchShowtimes,
    createShowtime,
    updateShowtime,
    deleteShowtime,
    autoSchedule,
  } = useShowtimes(selectedMovieId);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [formData, setFormData] = useState({
    movieId: "",
    roomId: "",
    startTime: "",
    language: "Vietsub",
  });

  // Auto Schedule Modal
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [autoScheduleData, setAutoScheduleData] = useState({
    roomId: "",
    date: new Date().toISOString().split('T')[0],
    movieIds: [],
    //occupancyRate: 0.7
  });

  // Generate date range for next 7 days
  const dateRange = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  // Group showtimes by room and date
  const timelineData = useMemo(() => {
    const grouped = {};
    
    rooms.forEach(room => {
      grouped[room.roomId] = {
        room,
        showtimes: showtimes.filter(st => st.room?.roomId === room.roomId)
      };
    });
    
    return grouped;
  }, [rooms, showtimes]);

  // Filter showtimes by selected date
  const filteredShowtimesByDate = useMemo(() => {
    return showtimes.filter(st => {
      const stDate = new Date(st.startTime).toISOString().split('T')[0];
      return stDate === selectedDate;
    });
  }, [showtimes, selectedDate]);

  useEffect(() => {
    if (selectedMovieId && !showModal) {
      setFormData(prev => ({ ...prev, movieId: selectedMovieId }));
    }
  }, [selectedMovieId, showModal]);

  const handleMovieSelect = (movieId) => {
    setSelectedMovieId(movieId);
  };

  const handleCreate = useCallback(() => {
    setModalMode("create");
    setSelectedShowtime(null);
    setFormData({
      movieId: selectedMovieId || "",
      roomId: "",
      startTime: selectedDate ? `${selectedDate}T09:00` : "",
      language: "Vietsub",
    });
    setShowModal(true);
  }, [selectedMovieId, selectedDate]);

  const handleEdit = useCallback((showtime) => {
    setModalMode("edit");
    setSelectedShowtime(showtime);
    
    const formattedTime = showtime.startTime 
      ? new Date(showtime.startTime).toISOString().slice(0, 16)
      : "";

    setFormData({
      movieId: showtime.movie?.movieId || "",
      roomId: showtime.room?.roomId || "",
      startTime: formattedTime,
      language: showtime.language || "Vietsub",
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (showtimeId) => {
      if (window.confirm("Bạn có chắc muốn xóa suất chiếu này?")) {
        try {
          await deleteShowtime(showtimeId, selectedMovieId);
          alert("Xóa suất chiếu thành công!");
        } catch (err) {
          alert("Lỗi: " + err.message);
        }
      }
    },
    [deleteShowtime, selectedMovieId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.movieId || !formData.roomId || !formData.startTime) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      const isoTime = formData.startTime.length === 16 
        ? formData.startTime + ":00" 
        : formData.startTime;

      const showtimeData = {
        movieId: formData.movieId,
        roomId: formData.roomId,
        startTime: isoTime,
        language: formData.language,
      };

      if (modalMode === "create") {
        await createShowtime(showtimeData);
        alert("Tạo suất chiếu thành công!");
      } else {
        await updateShowtime(selectedShowtime.showtimeId, showtimeData, selectedMovieId);
        alert("Cập nhật suất chiếu thành công!");
      }

      setShowModal(false);
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleAutoSchedule = async (e) => {
    e.preventDefault();
    
    if (!autoScheduleData.roomId || !autoScheduleData.date) {
      alert("Vui lòng chọn phòng và ngày!");
      return;
    }

    try {
      const result = await autoSchedule({
        roomId: autoScheduleData.roomId,
        date: autoScheduleData.date,
        movieIds: autoScheduleData.movieIds,
        //occupancyRate: autoScheduleData.occupancyRate
      });
      
      alert(`Đã tạo ${result?.length || 0} suất chiếu tự động!`);
      setShowAutoScheduleModal(false);
      await fetchShowtimes(selectedMovieId);
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return "";
    return new Date(dateTime).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "";
    return new Date(dateTime).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Ngày mai";
    
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit"
    });
  };

  const getTimelinePosition = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const dayStart = 6; // 6 AM
    const dayEnd = 24; // 12 AM
    const totalHours = dayEnd - dayStart;
    
    const left = ((startHour - dayStart) / totalHours) * 100;
    const width = ((endHour - startHour) / totalHours) * 100;
    
    return { left: Math.max(0, left), width: Math.max(1, width) };
  };

  const getMovieColor = (movieId) => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    const index = parseInt(movieId) % colors.length;
    return colors[index];
  };

  return (
    <div className="showtime-management-container">
      {/* Header */}
      <div className="showtime-management-header">
        <h1 className="showtime-management-title">Quản Lý Suất Chiếu</h1>
        
        <div className="showtime-management-controls">
          <select
            className="showtime-management-select"
            value={selectedMovieId}
            onChange={(e) => handleMovieSelect(e.target.value)}
          >
            <option value="">-- Tất Cả Phim --</option>
            {movies.map((movie) => (
              <option key={movie.movieId} value={movie.movieId}>
                {movie.title}
              </option>
            ))}
          </select>

          <div className="showtime-management-view-toggle">
            <button
              className={`showtime-management-toggle-btn ${viewMode === "timeline" ? "showtime-management-toggle-btn-active" : ""}`}
              onClick={() => setViewMode("timeline")}
            >
              Timeline
            </button>
            <button
              className={`showtime-management-toggle-btn ${viewMode === "table" ? "showtime-management-toggle-btn-active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              Danh Sách
            </button>
          </div>

          <button
            className="showtime-management-btn-auto-schedule"
            onClick={() => setShowAutoScheduleModal(true)}
          >
            🤖 Lập Lịch Tự Động
          </button>

          <button
            className="showtime-management-btn-create"
            onClick={handleCreate}
          >
            + Thêm Suất Chiếu
          </button>
        </div>
      </div>

      {error && <div className="showtime-management-error">{error}</div>}

      {/* Date Selector for Timeline View */}
      {viewMode === "timeline" && (
        <div className="showtime-management-date-selector">
          {dateRange.map(date => (
            <button
              key={date}
              className={`showtime-management-date-btn ${selectedDate === date ? "showtime-management-date-btn-active" : ""}`}
              onClick={() => setSelectedDate(date)}
            >
              {formatDateDisplay(date)}
              <div className="showtime-management-date-btn-date">{date.split('-')[2]}</div>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="showtime-management-loading">Đang tải...</div>
      ) : viewMode === "timeline" ? (
        /* Timeline View */
        <div className="showtime-management-timeline-container">
          {/* Time Header */}
          <div className="showtime-management-time-header">
            <div className="showtime-management-room-label">Phòng</div>
            <div className="showtime-management-time-grid">
              {Array.from({ length: 19 }, (_, i) => i + 6).map(hour => (
                <div key={hour} className="showtime-management-time-label">
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="showtime-management-timeline-body">
            {Object.values(timelineData).map(({ room, showtimes: roomShowtimes }) => {
              const dayShowtimes = roomShowtimes.filter(st => {
                const stDate = new Date(st.startTime).toISOString().split('T')[0];
                return stDate === selectedDate;
              });

              return (
                <div key={room.roomId} className="showtime-management-timeline-row">
                  <div className="showtime-management-room-cell">
                    <div className="showtime-management-room-name">{room.name}</div>
                    <div className="showtime-management-room-capacity">{room.capacity} ghế</div>
                  </div>
                  
                  <div className="showtime-management-timeline-track">
                    {/* Hour Grid Lines */}
                    {Array.from({ length: 18 }, (_, i) => (
                      <div
                        key={i}
                        className="showtime-management-grid-line"
                        style={{ left: `${(i / 18) * 100}%` }}
                      />
                    ))}

                    {/* Showtime Blocks */}
                    {dayShowtimes.map(showtime => {
                      const { left, width } = getTimelinePosition(
                        showtime.startTime,
                        showtime.endTime
                      );
                      const bgColor = getMovieColor(showtime.movie?.movieId);

                      return (
                        <div
                          key={showtime.showtimeId}
                          className="showtime-management-showtime-block"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            backgroundColor: bgColor,
                          }}
                          onClick={() => handleEdit(showtime)}
                        >
                          <div className="showtime-management-showtime-content">
                            <div className="showtime-management-showtime-title">
                              {showtime.movie?.title}
                            </div>
                            <div className="showtime-management-showtime-time">
                              {formatTime(showtime.startTime)} - {formatTime(showtime.endTime)}
                            </div>
                            <div className="showtime-management-showtime-lang">
                              {showtime.language}
                            </div>
                          </div>
                          <button
                            className="showtime-management-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(showtime.showtimeId);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                    {dayShowtimes.length === 0 && (
                      <div className="showtime-management-empty-track">
                        Không có suất chiếu
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {rooms.length === 0 && (
            <div className="showtime-management-empty-state">
              Chưa có phòng chiếu nào
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="showtime-management-table-container">
          {showtimes.length === 0 ? (
            <div className="showtime-management-empty-state">
              {selectedMovieId 
                ? "Chưa có suất chiếu nào cho phim này" 
                : "Chưa có suất chiếu nào"}
            </div>
          ) : (
            <table className="showtime-management-table">
              <thead>
                <tr>
                  <th className="showtime-management-th">Phim</th>
                  <th className="showtime-management-th">Phòng</th>
                  <th className="showtime-management-th">Thời Gian Bắt Đầu</th>
                  <th className="showtime-management-th">Thời Gian Kết Thúc</th>
                  <th className="showtime-management-th">Ngôn Ngữ</th>
                  <th className="showtime-management-th">Sức Chứa</th>
                  <th className="showtime-management-th">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map((showtime) => (
                  <tr key={showtime.showtimeId} className="showtime-management-tr">
                    <td className="showtime-management-td">
                      <div className="showtime-management-movie-info">
                        <strong>{showtime.movie?.title || "N/A"}</strong>
                        <small className="showtime-management-duration">{showtime.movie?.duration || 0} phút</small>
                      </div>
                    </td>
                    <td className="showtime-management-td">{showtime.room?.name || "N/A"}</td>
                    <td className="showtime-management-td">{formatDateTime(showtime.startTime)}</td>
                    <td className="showtime-management-td">{formatDateTime(showtime.endTime)}</td>
                    <td className="showtime-management-td">
                      <span className="showtime-management-lang-badge">{showtime.language}</span>
                    </td>
                    <td className="showtime-management-td">{showtime.room?.capacity || 0} ghế</td>
                    <td className="showtime-management-td">
                      <div className="showtime-management-action-btns">
                        <button
                          className="showtime-management-btn-edit"
                          onClick={() => handleEdit(showtime)}
                        >
                          Sửa
                        </button>
                        <button
                          className="showtime-management-btn-delete"
                          onClick={() => handleDelete(showtime.showtimeId)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="showtime-management-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="showtime-management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="showtime-management-modal-header">
              <h2 className="showtime-management-modal-title">
                {modalMode === "create" ? "Thêm Suất Chiếu Mới" : "Chỉnh Sửa Suất Chiếu"}
              </h2>
              <button className="showtime-management-btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="showtime-management-form">
              <div className="showtime-management-form-group">
                <label className="showtime-management-label">Phim *</label>
                <select
                  className="showtime-management-input"
                  value={formData.movieId}
                  onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn Phim --</option>
                  {movies.map((movie) => (
                    <option key={movie.movieId} value={movie.movieId}>
                      {movie.title} ({movie.duration} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div className="showtime-management-form-group">
                <label className="showtime-management-label">Phòng Chiếu *</label>
                <select
                  className="showtime-management-input"
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn Phòng --</option>
                  {rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.name} (Sức chứa: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="showtime-management-form-group">
                <label className="showtime-management-label">Thời Gian Bắt Đầu *</label>
                <input
                  type="datetime-local"
                  className="showtime-management-input"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
                <small className="showtime-management-hint">
                  Thời gian kết thúc sẽ được tính tự động dựa trên thời lượng phim
                </small>
              </div>

              <div className="showtime-management-form-group">
                <label className="showtime-management-label">Ngôn Ngữ *</label>
                <select
                  className="showtime-management-input"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  required
                >
                  <option value="Vietsub">Vietsub</option>
                  <option value="Lồng Tiếng">Lồng Tiếng</option>
                  <option value="Phụ Đề Anh">Phụ Đề Anh</option>
                </select>
              </div>

              <div className="showtime-management-modal-footer">
                <button
                  type="button"
                  className="showtime-management-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="showtime-management-btn-submit">
                  {modalMode === "create" ? "Tạo Suất Chiếu" : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Schedule Modal */}
      {showAutoScheduleModal && (
        <div className="showtime-management-modal-overlay" onClick={() => setShowAutoScheduleModal(false)}>
          <div className="showtime-management-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="showtime-management-modal-header">
              <h2 className="showtime-management-modal-title">Lập Lịch Tự Động</h2>
              <button className="showtime-management-btn-close" onClick={() => setShowAutoScheduleModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleAutoSchedule} className="showtime-management-form">
              <div className="showtime-management-form-group">
                <label className="showtime-management-label">Phòng Chiếu *</label>
                <select
                  className="showtime-management-input"
                  value={autoScheduleData.roomId}
                  onChange={(e) => setAutoScheduleData({ ...autoScheduleData, roomId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn Phòng --</option>
                  {rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="showtime-management-form-group">
                <label className="showtime-management-label">Ngày *</label>
                <input
                  type="date"
                  className="showtime-management-input"
                  value={autoScheduleData.date}
                  onChange={(e) => setAutoScheduleData({ ...autoScheduleData, date: e.target.value })}
                  required
                />
              </div>

              <div className="showtime-management-form-group">
                <label className="showtime-management-label">Chọn Phim (Tùy chọn)</label>
                <select
                  multiple
                  className="showtime-management-input"
                  style={{height: '120px'}}
                  value={autoScheduleData.movieIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setAutoScheduleData({ ...autoScheduleData, movieIds: selected });
                  }}
                >
                  {movies.map((movie) => (
                    <option key={movie.movieId} value={movie.movieId}>
                      {movie.title}
                    </option>
                  ))}
                </select>
                <small className="showtime-management-hint">
                  Giữ Ctrl/Cmd để chọn nhiều phim. Bỏ trống để hệ thống tự chọn
                </small>
              </div>

              {/*<div className="showtime-management-form-group">*/}
              {/*  <label className="showtime-management-label">Tỷ Lệ Lấp Đầy Mục Tiêu: {(autoScheduleData.occupancyRate * 100).toFixed(0)}%</label>*/}
              {/*  <input*/}
              {/*    type="range"*/}
              {/*    min="0.5"*/}
              {/*    max="1"*/}
              {/*    step="0.05"*/}
              {/*    className="showtime-management-slider"*/}
              {/*    value={autoScheduleData.occupancyRate}*/}
              {/*    onChange={(e) => setAutoScheduleData({ ...autoScheduleData, occupancyRate: parseFloat(e.target.value) })}*/}
              {/*  />*/}
              {/*  <small className="showtime-management-hint">*/}
              {/*    Hệ thống sẽ cố gắng đạt tỷ lệ lấp đầy này cho phòng*/}
              {/*  </small>*/}
              {/*</div>*/}

              <div className="showtime-management-modal-footer">
                <button
                  type="button"
                  className="showtime-management-btn-cancel"
                  onClick={() => setShowAutoScheduleModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="showtime-management-btn-submit">
                  Tạo Lịch Tự Động
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}