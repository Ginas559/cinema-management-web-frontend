import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRegisteredShifts } from "../services/ScheduleService";
import "../styles/myshift-timeline.css";

/* Utils */
const toDateSafe = (x) => {
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d;
};
const normalizeDateKey = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim();
  const iso = /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
  if (iso) return iso;
  const d = toDateSafe(s) || toDateSafe(`${s}T00:00:00`);
  if (!d) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const fmtDate = (d) => {
  const dt = toDateSafe(d) || toDateSafe(`${d}T00:00:00`);
  return dt ? dt.toLocaleDateString("vi-VN") : String(d || "—");
};
const fmtShortDate = (d) => {
  const dt = toDateSafe(d) || toDateSafe(`${d}T00:00:00`);
  if (!dt) return { d: String(d || "—"), wd: "" };
  return {
    wd: dt.toLocaleDateString("vi-VN", { weekday: "short" }),
    d: dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
  };
};
const fmtTime = (t) => {
  if (!t) return "—";
  const p = String(t).split(":");
  return p.length >= 2 ? `${p[0]}:${p[1]}` : t;
};

/* UI bits */
function StatusChip({ status }) {
  const s = String(status || "").toUpperCase();
  return <span className={`mst-chip mst-${s || "EMPTY"}`}>{s || "—"}</span>;
}

export default function MyShiftTimeline() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyRegisteredShifts();
        const shifts = Array.isArray(data) ? data : [];
        // sort by date asc
        shifts.sort((a, b) => {
          const pick = (x) => {
            if (x?.workDate) return normalizeDateKey(x.workDate);
            if (x?.date) return normalizeDateKey(x.date);
            const m = (x?.name || "").match(/\d{4}-\d{2}-\d{2}/);
            return m ? m[0] : "";
          };
          return new Date(pick(a)) - new Date(pick(b));
        });
        setItems(shifts);
      } catch (e) {
        const status = e?.response?.status;
        let msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Không thể tải dữ liệu.";
        if (status === 401) msg = "Thiếu/không hợp lệ token. Vui lòng đăng nhập lại.";
        if (status === 403) msg = "Bạn không có quyền xem trang này.";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Dựng lưới ngày & 3 hàng ca */
  const { days, matrix, notesByRow } = useMemo(() => {
    const keyToRaw = new Map();
    for (const s of items) {
      let raw = s?.workDate ?? s?.date ?? null;
      if (!raw && s?.name) {
        const m = s.name.match(/\d{4}-\d{2}-\d{2}/);
        if (m) raw = m[0];
      }
      if (!raw) continue;
      const key = normalizeDateKey(raw);
      if (!keyToRaw.has(key)) keyToRaw.set(key, raw);
    }
    const keys = Array.from(keyToRaw.keys()).sort((a, b) => new Date(a) - new Date(b));
    const rows = ["Morning", "Noon", "Evening"];
    const mat = rows.map(() => keys.map(() => null));
    const notes = [[], [], []];

    for (const s of items) {
      let raw = s?.workDate ?? s?.date ?? null;
      if (!raw && s?.name) {
        const m = s.name.match(/\d{4}-\d{2}-\d{2}/);
        if (m) raw = m[0];
      }
      if (!raw) continue;
      const colIdx = keys.indexOf(normalizeDateKey(raw));
      if (colIdx < 0) continue;

      const byName = (s?.name || "").toLowerCase();
      let rowIdx = 0;
      if (byName.includes("noon") || byName.includes("afternoon")) rowIdx = 1;
      else if (byName.includes("evening") || byName.includes("night")) rowIdx = 2;

      mat[rowIdx][colIdx] = s;
      if (s?.note) notes[rowIdx].push(s.note);
    }
    return { days: keys.map((k) => keyToRaw.get(k)), matrix: mat, notesByRow: notes };
  }, [items]);

  return (
    <div className="mst-wrap">
      <div className="mst-head">
        <h2 className="mst-title">📅 Lịch đã đăng ký của tôi</h2>
        <button className="mst-back" onClick={() => navigate("/sched")}>← Go back</button>
      </div>

      {err && !loading && <div className="mst-alert mst-error">{err}</div>}

      {!err && !loading && items.length === 0 && (
        <div className="mst-emptyCard">
          <div className="mst-emptyIcon">🗓️</div>
          <div className="mst-emptyTitle">Bạn chưa đăng ký ca nào</div>
          <div className="mst-emptyHint">Hãy quay về trang Lịch làm để đăng ký ca phù hợp.</div>
        </div>
      )}

      {/* Lưới 2 cột: Trái (4 hàng: Header + 3 slot) | Giữa (4 hàng: Header + 3 dòng ca + cột Ghi chú sticky) */}
      <div className="mst-grid2">
        {/* CỘT TRÁI: 4 hàng khớp chiều cao với phần giữa */}
        <div className="mst-leftCol">
          <div className="mst-leftCell mst-leftCell--header">
            <div className="mst-leftTitle">Ca</div>
            <div className="mst-leftSub">Ngày bắt đầu</div>
          </div>
          <div className="mst-leftCell mst-leftRow">
            <div className="mst-slotName">Morning</div>
            <div className="mst-slotSub">07:00–11:00</div>
          </div>
          <div className="mst-leftCell mst-leftRow">
            <div className="mst-slotName">Noon</div>
            <div className="mst-slotSub">12:00–16:00</div>
          </div>
          <div className="mst-leftCell mst-leftRow">
            <div className="mst-slotName">Evening</div>
            <div className="mst-slotSub">18:00–22:00</div>
          </div>
        </div>

        {/* CỘT GIỮA: 4 hàng tương ứng (Header + 3 daysRow) */}
        <div className="mst-centerCol">
          <div className="mst-scroller" style={{ "--mst-day-count": days.length }}>
            {/* Header ngày + cột Ghi chú (sticky bên phải) */}
            <div className="mst-daysHeader">
              {days.map((d, i) => {
                const { d: md, wd } = fmtShortDate(d);
                return (
                  <div key={i} className="mst-dayCell" title={fmtDate(d)}>
                    <div className="mst-dayTop">{wd}</div>
                    <div className="mst-dayMain">{md}</div>
                  </div>
                );
              })}
              <div className="mst-noteHead sticky-note">Ghi chú</div>
            </div>

            {/* Morning */}
            <div className="mst-daysRow">
              {days.map((_, c) => {
                const s = matrix?.[0]?.[c] || null;
                const start = s?.startTime, end = s?.endTime;
                return (
                  <div key={`m-${c}`} className={`mst-cell ${s ? "has-shift" : ""}`}>
                    {s ? (
                      <div className="mst-shiftBar">
                        <div className="mst-shiftMain">
                          <span className="mst-shiftName" title={s?.name}>{s?.name}</span>
                          <span className="mst-shiftTime">⏰ {fmtTime(start)}–{fmtTime(end)}</span>
                        </div>
                        <div className="mst-shiftMeta">
                          <StatusChip status={s?.shiftStatus} />
                        </div>
                      </div>
                    ) : <div className="mst-emptyDot" />}
                  </div>
                );
              })}
              <div className="mst-noteCol sticky-note">
                {(notesByRow?.[0] || []).length
                  ? <ul className="mst-noteList">{notesByRow[0].map((n,i)=><li key={i} className="mst-noteText">{n}</li>)}</ul>
                  : <span className="mst-noteText">—</span>}
              </div>
            </div>

            {/* Noon */}
            <div className="mst-daysRow">
              {days.map((_, c) => {
                const s = matrix?.[1]?.[c] || null;
                const start = s?.startTime, end = s?.endTime;
                return (
                  <div key={`n-${c}`} className={`mst-cell ${s ? "has-shift" : ""}`}>
                    {s ? (
                      <div className="mst-shiftBar">
                        <div className="mst-shiftMain">
                          <span className="mst-shiftName" title={s?.name}>{s?.name}</span>
                          <span className="mst-shiftTime">⏰ {fmtTime(start)}–{fmtTime(end)}</span>
                        </div>
                        <div className="mst-shiftMeta">
                          <StatusChip status={s?.shiftStatus} />
                        </div>
                      </div>
                    ) : <div className="mst-emptyDot" />}
                  </div>
                );
              })}
              <div className="mst-noteCol sticky-note">
                {(notesByRow?.[1] || []).length
                  ? <ul className="mst-noteList">{notesByRow[1].map((n,i)=><li key={i} className="mst-noteText">{n}</li>)}</ul>
                  : <span className="mst-noteText">—</span>}
              </div>
            </div>

            {/* Evening */}
            <div className="mst-daysRow">
              {days.map((_, c) => {
                const s = matrix?.[2]?.[c] || null;
                const start = s?.startTime, end = s?.endTime;
                return (
                  <div key={`e-${c}`} className={`mst-cell ${s ? "has-shift" : ""}`}>
                    {s ? (
                      <div className="mst-shiftBar">
                        <div className="mst-shiftMain">
                          <span className="mst-shiftName" title={s?.name}>{s?.name}</span>
                          <span className="mst-shiftTime">⏰ {fmtTime(start)}–{fmtTime(end)}</span>
                        </div>
                        <div className="mst-shiftMeta">
                          <StatusChip status={s?.shiftStatus} />
                        </div>
                      </div>
                    ) : <div className="mst-emptyDot" />}
                  </div>
                );
              })}
              <div className="mst-noteCol sticky-note">
                {(notesByRow?.[2] || []).length
                  ? <ul className="mst-noteList">{notesByRow[2].map((n,i)=><li key={i} className="mst-noteText">{n}</li>)}</ul>
                  : <span className="mst-noteText">—</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
