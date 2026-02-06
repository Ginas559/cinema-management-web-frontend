import React, { useEffect, useMemo, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Link } from 'react-router-dom';
import '../styles/events-carousel.css';
import client from '../services/api';

// Helpers
function parseDate(d) {
    if (!d) return null;
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? null : dt;
}
function getStatus(e, now = new Date()) {
    const s = parseDate(e.discountStartDate);
    const t = parseDate(e.discountEndDate);
    const nowMs = now.getTime();
    const soonMs = nowMs + 3 * 24 * 60 * 60 * 1000;

    if (s && nowMs < s.getTime()) return 'upcoming';
    if (t && nowMs > t.getTime()) return 'expired';
    const ongoing = (!s || s.getTime() <= nowMs) && (!t || t.getTime() >= nowMs);
    if (ongoing && t && t.getTime() <= soonMs) return 'ending';
    return ongoing ? 'ongoing' : 'any';
}

export default function EventsCarousel() {
    const [events, setEvents] = useState([]);
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [deltaX, setDeltaX] = useState(0);
    const startXRef = useRef(0);
    const viewportRef = useRef(null);
    const [vw, setVw] = useState(0);

    const clientRef = useRef(null);
    const subRef = useRef(null);
    const AUTOPLAY_MS = 5000;

    // Measure width
    useEffect(() => {
        function measure() {
            const w = viewportRef.current?.clientWidth || 0;
            setVw(w);
        }
        measure();
        const ro = new ResizeObserver(measure);
        if (viewportRef.current) ro.observe(viewportRef.current);
        window.addEventListener('resize', measure);
        return () => {
            try { ro.disconnect(); } catch { }
            window.removeEventListener('resize', measure);
        };
    }, []);

    // Load events and subscribe WS
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await client.get('/api/events');
                if (!alive) return;
                const list = Array.isArray(res.data) ? res.data : [];
                setEvents(list);
            } catch (e) {
                console.error('Load events failed', e?.response?.data || e?.message);
            }
        })();

        const WS_URL = `${window.location.protocol}//${window.location.hostname}:8080/ws/events`;
        const c = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 4000,
            onConnect: () => {
                subRef.current = c.subscribe('/topic/events', (msg) => {
                    try {
                        const evt = JSON.parse(msg.body);
                        setEvents((prev) => [evt, ...prev].slice(0, 100));
                    } catch (err) {
                        console.error('Invalid event payload', err);
                    }
                });
            },
            onStompError: (f) => console.error('STOMP error', f.headers['message']),
        });
        clientRef.current = c;
        c.activate();

        return () => {
            alive = false;
            try { subRef.current?.unsubscribe(); } catch { }
            c.deactivate();
        };
    }, []);

    // Filter and prepare slides (hide expired by default)
    const slides = useMemo(() => {
        const now = new Date();
        return (events || [])
            .map((e) => ({ ...e, _status: getStatus(e, now) }))
            .filter((e) => e._status !== 'expired');
    }, [events]);

    // Clamp index when slides change
    useEffect(() => {
        if (slides.length === 0) {
            setIndex(0);
        } else if (index >= slides.length) {
            setIndex(0);
        }
    }, [slides, index]);

    // Auto-play
    useEffect(() => {
        if (slides.length <= 1) return;
        if (paused || dragging) return;
        let t = setTimeout(() => {
            setIndex((i) => (i + 1) % slides.length);
        }, AUTOPLAY_MS);
        return () => clearTimeout(t);
    }, [slides.length, index, paused, dragging]);

    // Pause when tab hidden
    useEffect(() => {
        function onVis() { setPaused(document.hidden); }
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    // Drag/Swipe
    function prev() {
        if (slides.length === 0) return;
        setIndex((i) => (i - 1 + slides.length) % slides.length);
    }
    function next() {
        if (slides.length === 0) return;
        setIndex((i) => (i + 1) % slides.length);
    }
    function onPointerDown(e) {
        if (!vw) return;
        setDragging(true);
        setPaused(true);
        startXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        setDeltaX(0);
        try { e.target.setPointerCapture?.(e.pointerId); } catch { }
    }
    function onPointerMove(e) {
        if (!dragging) return;
        const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        setDeltaX(x - startXRef.current);
    }
    function onPointerUp() {
        if (!dragging) return;
        const threshold = Math.max(40, vw * 0.2);
        if (deltaX > threshold) prev();
        else if (deltaX < -threshold) next();
        setDragging(false);
        setDeltaX(0);
        setPaused(false);
    }

    return (
        <div className="evc-wrap">
            <div className="evc-inner evc-compact">
                <div
                    className="evc-viewport"
                    ref={viewportRef}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => !dragging && setPaused(false)}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onTouchStart={onPointerDown}
                    onTouchMove={onPointerMove}
                    onTouchEnd={onPointerUp}
                >
                    <div
                        className={`evc-track ${dragging ? 'dragging' : ''}`}
                        style={{
                            width: `${(slides.length || 1) * 100}%`,
                            transform: `translate3d(${-(index * vw) + deltaX}px, 0, 0)`,
                            transition: dragging ? 'none' : 'transform .3s ease',
                        }}
                    >
                        {(slides.length ? slides : [{ name: 'Chưa có sự kiện', description: '', discountPercent: null, _status: 'any' }]).map((e, i) => {
                            const pct = e.discountPercent != null ? Math.round(Number(e.discountPercent)) : null;
                            return (
                                <div
                                    className="evc-slide"
                                    key={(e.eventId || 'ev') + '-' + i}
                                    style={{ width: vw || '100%' }}
                                >
                                    <div className="evc-card evc-card-compact">
                                        <div className="evc-card-left">
                                            <div className="evc-line1">
                                                {e._status !== 'any' && (
                                                    <span className={`evc-badge evc-${e._status}`}>
                                                        {e._status === 'ongoing' ? 'Đang diễn ra' : e._status === 'upcoming' ? 'Sắp diễn ra' : e._status === 'ending' ? 'Sắp kết thúc' : ''}
                                                    </span>
                                                )}
                                                {pct != null && <span className={`evc-sale ${pct >= 50 ? 'hot' : ''}`}>-{pct}%</span>}
                                            </div>
                                            <div className="evc-name" title={e.name}>{e.name}</div>
                                            {e.description ? (
                                                <div className="evc-desc" title={e.description}>{e.description}</div>
                                            ) : null}
                                        </div>
                                        <div className="evc-card-right">
                                            <Link className="evc-link evc-link-sm" to="/ev-prom">Chi tiết</Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dots only */}
                <div className="evc-footer evc-footer-compact">
                    <div className="evc-dots" role="tablist" aria-label="Điều hướng sự kiện">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                className={`evc-dotbtn ${i === index ? 'active' : ''}`}
                                onClick={() => setIndex(i)}
                                role="tab"
                                aria-selected={i === index}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}