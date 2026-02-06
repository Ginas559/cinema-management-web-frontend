import React, { useEffect, useMemo, useState } from 'react';
import '../styles/events.css';
import { useAuth } from '../hooks/useAuth';
import EventForm from '../components/EventForm';
import client from '../services/api';

function fmtDate(d) {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    try {
        const dt = new Date(d);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    } catch {
        return d;
    }
}

export default function EventsPromotions() {
    const { user } = useAuth();
    const role = user?.role;
    const canManage = useMemo(() => role === 'ADMIN' || role === 'MANAGER', [role]);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [banner, setBanner] = useState(null);

    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const load = async () => {
        setLoading(true);
        setErr('');
        try {
            const res = await client.get('/api/events');
            const data = (res.data || []).map((e) => ({
                ...e,
                discountStartDate: fmtDate(e.discountStartDate),
                discountEndDate: fmtDate(e.discountEndDate),
            }));
            setEvents(data);
        } catch (e) {
            setErr(e?.response?.data?.error || e?.message || 'Tải danh sách thất bại');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const showBanner = (type, text) => {
        setBanner({ type, text });
        setTimeout(() => setBanner(null), 2800);
    };

    const handleCreate = async (payload) => {
        try {
            const res = await client.post('/api/events', payload);
            const created = res.data;
            setEvents((prev) => [
                { ...created, discountStartDate: fmtDate(created.discountStartDate), discountEndDate: fmtDate(created.discountEndDate) },
                ...prev,
            ]);
            setOpenForm(false);
            showBanner('success', 'Tạo sự kiện thành công');
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Tạo thất bại';
            showBanner('error', msg);
            throw e;
        }
    };

    const handleUpdate = async (id, payload) => {
        try {
            const res = await client.put(`/api/events/${id}`, payload);
            const updated = res.data;
            setEvents((prev) =>
                prev.map((x) =>
                    x.eventId === id
                        ? { ...updated, discountStartDate: fmtDate(updated.discountStartDate), discountEndDate: fmtDate(updated.discountEndDate) }
                        : x
                )
            );
            setEditing(null);
            setOpenForm(false);
            showBanner('success', 'Cập nhật sự kiện thành công');
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Cập nhật thất bại';
            showBanner('error', msg);
            throw e;
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa sự kiện này?')) return;
        try {
            await client.delete(`/api/events/${id}`);
            setEvents((prev) => prev.filter((x) => x.eventId !== id));
            showBanner('success', 'Đã xóa sự kiện');
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Xóa thất bại';
            showBanner('error', msg);
        }
    };

    return (
        <div className="ev-page ev-dark">
            <div className="ev-page-header">
                <div>
                    <h2 className="ev-title">Events & Promotions</h2>
                    <div className="ev-subtitle">Quản lý sự kiện và chương trình khuyến mãi</div>
                </div>
                {canManage && (
                    <button
                        className="ev-btn ev-btn-primary"
                        onClick={() => {
                            setEditing(null);
                            setOpenForm(true);
                        }}
                    >
                        + Sự kiện mới
                    </button>
                )}
            </div>

            {banner ? (
                <div className={`ev-banner ${banner.type === 'success' ? 'ev-banner-success' : 'ev-banner-error'}`}>
                    {banner.text}
                </div>
            ) : null}

            {loading ? (
                <div className="ev-skeleton">
                    <div className="ev-skeleton-line" />
                    <div className="ev-skeleton-line" />
                    <div className="ev-skeleton-line" />
                </div>
            ) : err ? (
                <div className="ev-alert ev-alert-error">{err}</div>
            ) : (
                <>
                    {openForm && (
                        <div className="ev-card ev-card-form">
                            <div className="ev-card-header">
                                <div className="ev-card-title">{editing ? 'Sửa sự kiện' : 'Tạo sự kiện'}</div>
                                <button className="ev-btn ev-btn-ghost" onClick={() => { setOpenForm(false); setEditing(null); }}>
                                    Đóng
                                </button>
                            </div>
                            <EventForm
                                initial={editing || null}
                                onSubmit={(payload) => (editing ? handleUpdate(editing.eventId, payload) : handleCreate(payload))}
                                onCancel={() => { setOpenForm(false); setEditing(null); }}
                                submitText={editing ? 'Cập nhật' : 'Tạo'}
                            />
                        </div>
                    )}

                    <div className="ev-card">
                        <div className="ev-card-header">
                            <div className="ev-card-title">Danh sách sự kiện</div>
                            <div className="ev-meta">{events.length} sự kiện</div>
                        </div>
                        {events.length === 0 ? (
                            <div className="ev-empty">Chưa có sự kiện nào</div>
                        ) : (
                            <div className="ev-table-wrap">
                                <table className="ev-table">
                                    <thead>
                                        <tr>
                                            <th>Tên</th>
                                            <th>Mô tả</th>
                                            <th>Giảm</th>
                                            <th>Bắt đầu</th>
                                            <th>Kết thúc</th>
                                            {canManage ? <th style={{ width: 180 }}>Thao tác</th> : null}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((e) => {
                                            const pct = Number(e.discountPercent ?? 0);
                                            return (
                                                <tr key={e.eventId}>
                                                    <td className="ev-cell-strong">{e.name}</td>
                                                    <td>{e.description || '—'}</td>
                                                    <td>
                                                        <span className={`ev-badge ${pct >= 50 ? 'ev-badge-hot' : ''}`}>
                                                            {pct.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td>{e.discountStartDate || '—'}</td>
                                                    <td>{e.discountEndDate || '—'}</td>
                                                    {canManage ? (
                                                        <td>
                                                            <button
                                                                className="ev-btn ev-btn-ghost"
                                                                onClick={() => {
                                                                    setEditing(e);
                                                                    setOpenForm(true);
                                                                }}
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                className="ev-btn ev-btn-danger"
                                                                onClick={() => handleDelete(e.eventId)}
                                                            >
                                                                Xóa
                                                            </button>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}