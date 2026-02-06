import React, { useEffect, useMemo, useState } from 'react';

const INIT = {
    name: '',
    description: '',
    discountPercent: 0,
    discountStartDate: '',
    discountEndDate: '',
};

export default function EventForm({
    initial,
    onSubmit,
    onCancel,
    submitText = 'Tạo',
}) {
    const [form, setForm] = useState(INIT);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || '',
                description: initial.description || '',
                discountPercent: initial.discountPercent ?? 0,
                discountStartDate: initial.discountStartDate || '',
                discountEndDate: initial.discountEndDate || '',
            });
        } else {
            setForm(INIT);
        }
        setErrors({});
        setTouched({});
    }, [initial]);

    const validation = useMemo(() => {
        const e = {};
        if (!form.name.trim()) e.name = 'Tên sự kiện là bắt buộc';
        if (form.discountPercent == null || Number.isNaN(form.discountPercent)) {
            e.discountPercent = 'Vui lòng nhập phần trăm giảm';
        } else if (form.discountPercent < 0) {
            e.discountPercent = 'Phần trăm giảm phải ≥ 0';
        } else if (form.discountPercent > 100) {
            e.discountPercent = 'Phần trăm giảm không được vượt quá 100%';
        }
        if (form.discountStartDate && form.discountEndDate) {
            if (form.discountEndDate < form.discountStartDate) {
                e.discountEndDate = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu';
            }
        }
        return e;
    }, [form]);

    useEffect(() => {
        setErrors(validation);
    }, [validation]);

    const canSubmit = useMemo(() => Object.keys(errors).length === 0, [errors]);

    const setField = (key, val) => {
        setForm((f) => ({ ...f, [key]: val }));
    };

    const onChangePercent = (val) => {
        let v = Number(val);
        if (Number.isNaN(v)) v = 0;
        if (v < 0) v = 0;
        if (v > 100) v = 100; // chặn > 100%
        setField('discountPercent', v);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({
            name: true,
            discountPercent: true,
            discountEndDate: true,
        });
        if (!canSubmit) return;
        try {
            setSubmitting(true);
            await onSubmit({
                ...form,
                discountStartDate: form.discountStartDate || null,
                discountEndDate: form.discountEndDate || null,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="ev-form">
            <div className="ev-form-grid">
                <div className="ev-form-field">
                    <label className="ev-label">Tên sự kiện</label>
                    <input
                        className={`ev-input ${touched.name && errors.name ? 'ev-input-error' : ''}`}
                        type="text"
                        placeholder="VD: Tuần lễ vàng - Sale off"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    />
                    {touched.name && errors.name ? (
                        <div className="ev-error">{errors.name}</div>
                    ) : (
                        <div className="ev-hint">Đặt tiêu đề ngắn gọn và dễ hiểu</div>
                    )}
                </div>

                <div className="ev-form-field">
                    <label className="ev-label">Mô tả</label>
                    <textarea
                        className="ev-textarea"
                        rows={3}
                        placeholder="Mô tả ưu đãi, điều kiện áp dụng..."
                        value={form.description}
                        onChange={(e) => setField('description', e.target.value)}
                    />
                </div>

                <div className="ev-form-field">
                    <label className="ev-label">Giảm giá (%)</label>
                    <div className="ev-percent-row">
                        <input
                            className={`ev-input ev-input-percent ${touched.discountPercent && errors.discountPercent ? 'ev-input-error' : ''}`}
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={form.discountPercent}
                            onChange={(e) => onChangePercent(e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, discountPercent: true }))}
                            onWheel={(e) => e.currentTarget.blur()}
                        />
                        <input
                            className="ev-range"
                            type="range"
                            min={0}
                            max={100}
                            step="1"
                            value={form.discountPercent || 0}
                            onChange={(e) => onChangePercent(e.target.value)}
                        />
                    </div>
                    <div className="ev-meter">
                        <div
                            className="ev-meter-bar"
                            style={{ width: `${Math.min(100, Math.max(0, form.discountPercent || 0))}%` }}
                        />
                        <span className="ev-meter-text">{(form.discountPercent ?? 0).toFixed(1)}%</span>
                    </div>
                    {touched.discountPercent && errors.discountPercent ? (
                        <div className="ev-error">{errors.discountPercent}</div>
                    ) : (
                        <div className="ev-hint">Giới hạn tối đa 100%</div>
                    )}
                </div>

                <div className="ev-form-field">
                    <label className="ev-label">Ngày bắt đầu</label>
                    <input
                        className="ev-input"
                        type="date"
                        value={form.discountStartDate || ''}
                        onChange={(e) => setField('discountStartDate', e.target.value)}
                    />
                </div>

                <div className="ev-form-field">
                    <label className="ev-label">Ngày kết thúc</label>
                    <input
                        className={`ev-input ${touched.discountEndDate && errors.discountEndDate ? 'ev-input-error' : ''}`}
                        type="date"
                        value={form.discountEndDate || ''}
                        onChange={(e) => setField('discountEndDate', e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, discountEndDate: true }))}
                    />
                    {touched.discountEndDate && errors.discountEndDate ? (
                        <div className="ev-error">{errors.discountEndDate}</div>
                    ) : null}
                </div>
            </div>

            <div className="ev-actions">
                <button className="ev-btn ev-btn-primary" type="submit" disabled={!canSubmit || submitting}>
                    {submitting ? 'Đang lưu...' : submitText}
                </button>
                {onCancel ? (
                    <button
                        type="button"
                        className="ev-btn ev-btn-ghost"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Hủy
                    </button>
                ) : null}
            </div>
        </form>
    );
}