import React, { useState, useEffect, useMemo, useRef } from "react";
import { getSeatsByShowtime, lockSeats, releaseSeats } from "../../../services/ShowtimeService";
import "../../../styles/seat-selector.css";

export default function SeatSelector({ showtimeId, onSelectSeats }) {
  const [seatMap, setSeatMap] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const lockedSeatsRef = useRef(new Set()); 

  const normalizeSeat = (s) => ({
    id: s.seatId,
    row: s.position?.substring(0, 1) || "A",
    col: Number(s.position?.substring(1)) || 0,
    status: (s.status || "AVAILABLE").toLowerCase(),
    price: s.price || 0,
    type: (s.type || "REGULAR").toLowerCase(),
    lastUpdate: s.lastUpdate,
  });

  const getCoupleSeatIds = (seatId) => {
    const seat = seatMap[seatId];
    if (!seat || seat.type !== "pair") return [seatId];

    const allSeatsInRow = Object.values(seatMap).filter(
      s => s.row === seat.row && s.type === "pair"
    ).sort((a, b) => a.col - b.col);

    for (let i = 0; i < allSeatsInRow.length; i += 2) {
      const seat1 = allSeatsInRow[i];
      const seat2 = allSeatsInRow[i + 1];
      
      if (seat1 && seat2 && (seat1.id === seatId || seat2.id === seatId)) {
        return [seat1.id, seat2.id];
      }
    }

    return [seatId];
  };

  const loadSeats = async (isInitialLoad = false) => {
    if (!showtimeId) {
      setSeatMap({});
      setError("Showtime not found.");
      return;
    }

    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const fetchedSeats = await getSeatsByShowtime(showtimeId);
      
      if (!Array.isArray(fetchedSeats)) {
        setSeatMap({});
        setError("Seat not found.");
        return;
      }

      setSeatMap((prevMap) => {
        const newMap = {};
        const currentLockedSeats = lockedSeatsRef.current;
        
        fetchedSeats.forEach((s) => {
          const seat = normalizeSeat(s);
          const seatId = seat.id;
          
          if (currentLockedSeats.has(seatId)) {
            if (seat.status === "occupied") {
              currentLockedSeats.delete(seatId);
              newMap[seatId] = seat;
            } else {
              newMap[seatId] = { ...seat, status: "locked" };
            }
          } else {
            newMap[seatId] = seat;
          }
        });
        
        return newMap;
      });
      
      setError(null);
    } catch (e) {
      console.error("❌ Error loading seats:", e);
      if (isInitialLoad) {
        setSeatMap({});
        setError(`Error: ${e.message}`);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadSeats(true);
  }, [showtimeId]);

  useEffect(() => {
    if (!showtimeId) return;

    intervalRef.current = setInterval(() => {
      loadSeats(false); 
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showtimeId]);

  useEffect(() => {
    return () => {
      const lockedSeatIds = Array.from(lockedSeatsRef.current);
      if (lockedSeatIds.length > 0) {
        releaseSeats(lockedSeatIds).catch(err => 
          console.error("Failed to release seats on unmount:", err)
        );
      }
    };
  }, []);

  const handleSelect = async (seatId) => {
    const seat = seatMap[seatId];
    
    if (!seat || seat.status === "occupied" || seat.status === "maintenance") {
      return;
    }

    const seatIds = getCoupleSeatIds(seatId);

    const hasUnavailableSeat = seatIds.some(id => {
      const s = seatMap[id];
      return !s || s.status === "occupied" || s.status === "maintenance";
    });

    if (hasUnavailableSeat) {
      setError("Không thể chọn ghế đôi này. Một hoặc cả hai ghế không khả dụng.");
      return;
    }

    const isCurrentlyLocked = seatIds.every(id => seatMap[id]?.status === "locked");

    if (isCurrentlyLocked) {
      try {
        await releaseSeats(seatIds);
        seatIds.forEach(id => lockedSeatsRef.current.delete(id));
        
        setSeatMap((prev) => {
          const newMap = { ...prev };
          seatIds.forEach(id => {
            newMap[id] = {
              ...prev[id],
              status: "available",
            };
          });
          return newMap;
        });
      } catch (err) {
        console.error("Failed to release seats:", err);
        setError("Không thể bỏ chọn ghế. Vui lòng thử lại.");
      }
    } else {
      try {
        const result = await lockSeats(seatIds);
        
        if (result.success) {
          seatIds.forEach(id => lockedSeatsRef.current.add(id));
          
          setSeatMap((prev) => {
            const newMap = { ...prev };
            seatIds.forEach(id => {
              newMap[id] = {
                ...prev[id],
                status: "locked",
              };
            });
            return newMap;
          });
        } else {
          setError("Ghế này đã được chọn bởi người khác.");
          // Force refresh to get latest state
          loadSeats(false);
        }
      } catch (err) {
        console.error("Failed to lock seats:", err);
        setError("Không thể chọn ghế. Có thể ghế đã được đặt.");
        // Force refresh
        loadSeats(false);
      }
    }
  };

  useEffect(() => {
    const selectedSeats = Object.values(seatMap).filter((s) => s.status === "locked");
    onSelectSeats(selectedSeats);
  }, [seatMap, onSelectSeats]);

  const { grouped, rows, maxCols } = useMemo(() => {
    const g = {};
    let maxCol = 0;
    const processedPairs = new Set();
    
    Object.values(seatMap).forEach((s) => {
      g[s.row] ||= {};
      
      if (s.type === "pair" && !processedPairs.has(s.id)) {
        const pairIds = getCoupleSeatIds(s.id);
        const seat1 = seatMap[pairIds[0]];
        const seat2 = seatMap[pairIds[1]];
        
        if (seat1 && seat2) {
          const minCol = Math.min(seat1.col, seat2.col);
          
          // Determine combined status for the pair
          const allLocked = pairIds.every(id => seatMap[id]?.status === "locked");
          const anyOccupied = pairIds.some(id => seatMap[id]?.status === "occupied");
          const anyMaintenance = pairIds.some(id => seatMap[id]?.status === "maintenance");
          
          let combinedStatus = "available";
          if (allLocked) combinedStatus = "locked";
          else if (anyOccupied) combinedStatus = "occupied";
          else if (anyMaintenance) combinedStatus = "maintenance";
          
          g[s.row][minCol] = {
            ...seat1,
            status: combinedStatus,
            isPair: true,
            pairIds: pairIds,
            col: minCol,
          };
          
          processedPairs.add(pairIds[0]);
          processedPairs.add(pairIds[1]);
          
          if (minCol + 1 > maxCol) maxCol = minCol + 1;
        }
      } else if (s.type !== "pair") {
        g[s.row][s.col] = s;
        if (s.col > maxCol) maxCol = s.col;
      }
    });
    
    const r = Object.keys(g).sort();
    return { grouped: g, rows: r, maxCols: maxCol };
  }, [seatMap]);

  return (
    <div className="seat-selector-layout">
      <div className="seat-selector-screen">Screen</div>

      {error && (
        <div className="seat-selector-error-banner">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="seat-selector-error-close"
          >
            ✕
          </button>
        </div>
      )}

      {loading && Object.keys(seatMap).length === 0 ? (
        <p className="seat-selector-loading-text">Đang tải dữ liệu ghế...</p>
      ) : (
        <>
          <div className="seat-selector-grid" style={{ gridTemplateColumns: `40px repeat(${maxCols}, 40px)` }}>
            {/* Column headers */}
            <div className="seat-selector-row-label" />
            {Array.from({ length: maxCols }, (_, i) => (
              <div key={`col-${i}`} className="seat-selector-col-label">
                {i + 1}
              </div>
            ))}

            {/* Seat rows */}
            {rows.map((r) => {
              const renderedCols = new Set();
              
              return (
                <React.Fragment key={r}>
                  <div className="seat-selector-row-label">{r}</div>
                  {Array.from({ length: maxCols }, (_, i) => {
                    const colNum = i + 1;
                    
                    // Skip if this column was already rendered as part of a pair seat
                    if (renderedCols.has(colNum)) {
                      return null;
                    }
                    
                    const seat = grouped[r][colNum];
                    
                    if (!seat) {
                      return (
                        <div key={`empty-${r}-${i}`} className="seat-selector-seat empty" aria-hidden="true" />
                      );
                    }

                    if (seat.isPair) {
                      const pairIds = seat.pairIds || [seat.id];
                      const allLocked = pairIds.every(id => seatMap[id]?.status === "locked");
                      const anyOccupied = pairIds.some(id => seatMap[id]?.status === "occupied");
                      const anyMaintenance = pairIds.some(id => seatMap[id]?.status === "maintenance");
                      
                      let status = "available";
                      if (allLocked) status = "locked";
                      else if (anyOccupied) status = "occupied";
                      else if (anyMaintenance) status = "maintenance";

                      // Mark next column as rendered since pair seat spans 2 columns
                      renderedCols.add(colNum);
                      renderedCols.add(colNum + 1);

                      return (
                        <button
                          type="button"
                          key={seat.id}
                          className={`seat-selector-seat ${status} pair`}
                          onClick={() => handleSelect(seat.id)}
                          disabled={status === "occupied" || status === "maintenance"}
                          aria-label={`Couple Seat ${r}${colNum}-${colNum + 1} - ${status}`}
                          style={{ gridColumn: 'span 2' }}
                        />
                      );
                    }

                    return (
                      <button
                        type="button"
                        key={seat.id}
                        className={`seat-selector-seat ${seat.status} ${seat.type}`}
                        onClick={() => handleSelect(seat.id)}
                        disabled={seat.status === "occupied" || seat.status === "maintenance"}
                        aria-label={`Seat ${r}${colNum} - ${seat.status} - ${seat.type}`}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

          {/* Real-time indicator */}
          <div className="seat-selector-realtime-indicator">
            <span className="seat-selector-realtime-dot" />
            Auto-refreshing seat status
          </div>
        </>
      )}

      {/* Legend */}
      <SeatLegend />

      {/* Entrances */}
      <div className="seat-selector-entrances">
        <span>ENTRANCE</span>
        <span>EXIT</span>
        <span>ENTRANCE</span>
      </div>
    </div>
  );
}

const SeatLegend = React.memo(() => (
  <div className="seat-selector-legend">
    <div className="seat-selector-legend-item">
      <div className="seat-selector-seat available"></div>
      <span>Available</span>
    </div>
    <div className="seat-selector-legend-item">
      <div className="seat-selector-seat locked"></div>
      <span>Selecting</span>
    </div>
    <div className="seat-selector-legend-item">
      <div className="seat-selector-seat occupied"></div>
      <span>Occupied</span>
    </div>
    <div className="seat-selector-legend-item">
      <div className="seat-selector-seat maintenance"></div>
      <span>Maintenance</span>
    </div>
    <div className="seat-selector-legend-item">
      <div className="seat-selector-seat available regular"></div>
      <span>Regular</span>
    </div>
    <div className="seat-selector-legend-item">
      <div className="seat-selector-seat available vip"></div>
      <span>VIP</span>
    </div>
    <div className="seat-selector-legend-item">
      <div className="seat-selector-seat available pair"></div>
      <span>Couple (2 seats)</span>
    </div>
  </div>
));