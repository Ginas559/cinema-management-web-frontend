import React, { useEffect, useMemo, useState } from "react";

function todayYYYYMMDD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function isActive(ev, today) {
    const start = ev.discountStartDate;
    const end = ev.discountEndDate;

    if (!start && !end) return true;       
    if (start && !end) return today >= start;
    if (!start && end) return today <= end;
    return today >= start && today <= end;
}

export default function PromotionSelector({
    selectedEventId,
    onChange,
}) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        let ignore = false;

        async function load() {
            setLoading(true);
            try {
              
                const res = await fetch("http://localhost:8080/api/events");
                if (!res.ok) throw new Error("Failed to load promotions");
                const data = await res.json();
                if (!ignore) setEvents(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                if (!ignore) setEvents([]);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        load();
        return () => {
            ignore = true;
        };
    }, []);

    const today = todayYYYYMMDD();
    const activeEvents = useMemo(
        () => (events || []).filter((ev) => isActive(ev, today)),
        [events, today]
    );

    const listToShow = showAll ? events : activeEvents;

    const handleSelect = (e) => {
        const val = e.target.value;
        if (!val) {
            onChange?.(null, null);
            return;
        }
        const ev = events.find((x) => x.eventId === val);
        onChange?.(val, ev ? ev.discountPercent || 0 : 0);
    };

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <h5 className="section-title">🏷️ Khuyến mãi</h5>

            {loading ? (
                <p className="text-muted">Đang tải khuyến mãi...</p>
            ) : listToShow.length === 0 ? (
                <>
                    <p className="text-muted">
                        Hiện chưa có khuyến mãi đang hiệu lực.
                    </p>
                    {events.length > 0 && (
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => setShowAll(true)}
                        >
                            Hiển thị tất cả khuyến mãi ({events.length})
                        </button>
                    )}
                </>
            ) : (
                <>
                    <select
                        className="form-select"
                        value={selectedEventId || ""}
                        onChange={handleSelect}
                    >
                        <option value="">Không áp dụng</option>
                        {listToShow.map((ev) => (
                            <option key={ev.eventId} value={ev.eventId}>
                                {ev.name} (-{ev.discountPercent}%)
                            </option>
                        ))}
                    </select>

                    {/* Nút hỗ trợ debug xem tất cả */}
                    {events.length > listToShow.length && (
                        <div className="d-flex justify-content-end">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary mt-2"
                                onClick={() => setShowAll((s) => !s)}
                            >
                                {showAll ? "Chỉ hiển thị đang hiệu lực" : `Xem tất cả (${events.length})`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}