import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProfile, getSimpleRecommendations } from "../services/ProfileService";
import "../styles/profile-me.css";

export default function ProfileMe() {
    const { user, openLoginModal } = useContext(AuthContext);
    const accountId = user?.accountId;
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [recs, setRecs] = useState({ byTopGenre: [], byTopActor: [] }); // [ADD]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const run = async () => {
            if (!accountId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // có thể Promise.all, nhưng để rõ ràng:
                const prof = await getProfile(accountId);
                setProfile(prof);

                // [ADD] gọi đề xuất
                const rec = await getSimpleRecommendations(accountId, 3);
                setRecs(rec || { byTopGenre: [], byTopActor: [] });
            } catch (err) {
                console.error("GET profile/recs error:", err);
                setError("Không thể tải hồ sơ hoặc đề xuất. Kiểm tra BE/DB.");
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [accountId]);

    if (!accountId) {
        return (
            <div className="profile-me-container">
                <div className="profile-me-card">
                    <p className="profile-me-text">Chưa đăng nhập.</p>
                    <button className="profile-me-btn profile-me-btn-primary" onClick={openLoginModal}>
                        Đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="profile-me-container">
                <div className="profile-me-card">
                    <div className="profile-me-placeholder">
                        <span className="profile-me-placeholder-line profile-me-placeholder-line-long"></span>
                        <span className="profile-me-placeholder-line profile-me-placeholder-line-short"></span>
                    </div>
                    <div className="profile-me-loading-text">Đang tải...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-me-container">
                <div className="profile-me-card">
                    <div className="profile-me-error">{error}</div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-me-container">
                <div className="profile-me-card">
                    <div className="profile-me-text">Không tìm thấy dữ liệu hồ sơ.</div>
                </div>
            </div>
        );
    }

    // helper để lấy “nhãn” top-genre/actor từ reason
    const topGenreLabel =
        recs?.byTopGenre?.[0]?.reason?.replace("top-genre: ", "") || "Không xác định";
    const topActorLabel =
        recs?.byTopActor?.[0]?.reason?.replace("top-actor: ", "") || "Không xác định";

    return (
        <div className="profile-me-container">
            {/* Header */}
            <div className="profile-me-header">
                <h2 className="profile-me-title">Hồ sơ cá nhân</h2>
                <button
                    onClick={() => navigate("/profile/avatar")}
                    className="profile-me-btn profile-me-btn-outline"
                >
                    Đổi avatar
                </button>
            </div>

            {/* Profile card */}
            <div className="profile-me-card profile-me-main-card">
                <div className="profile-me-content">
                    {/* Avatar */}
                    <div className="profile-me-avatar-wrapper">
                        <img
                            src={profile.avatarUrl || "https://via.placeholder.com/240x240?text=Avatar"}
                            alt="avatar"
                            className="profile-me-avatar"
                        />
                    </div>

                    {/* Info */}
                    <div className="profile-me-info">
                        <div className="profile-me-info-grid">
                            <div className="profile-me-field">
                                <div className="profile-me-label">Họ tên</div>
                                <div className="profile-me-value">{profile.fullName}</div>
                            </div>
                            <div className="profile-me-field">
                                <div className="profile-me-label">Vai trò</div>
                                <div className="profile-me-value">{profile.role}</div>
                            </div>
                            <div className="profile-me-field">
                                <div className="profile-me-label">Email</div>
                                <div className="profile-me-value">{profile.email || "Chưa cập nhật"}</div>
                            </div>
                            <div className="profile-me-field">
                                <div className="profile-me-label">Điện thoại</div>
                                <div className="profile-me-value">{profile.phone || "Chưa cập nhật"}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/profile/edit-basic")}
                        className="profile-me-btn profile-me-btn-edit"
                    >
                        Chỉnh sửa thông tin
                    </button>

                    {/* Social Media */}
                    <div className="profile-me-social-section">
                        <h5 className="profile-me-social-title">Mạng xã hội</h5>
                        <div className="profile-me-social-links">
                            {[
                                { label: "Facebook", url: profile.facebookUrl, color: "#0d6efd" },
                                { label: "Instagram", url: profile.instagramUrl, color: "#0dcaf0" },
                                { label: "Twitter", url: profile.twitterUrl, color: "#00acee" },
                                { label: "LinkedIn", url: profile.linkedInUrl, color: "#0077b5" },
                            ].map((item, idx) => (
                                <a
                                    key={idx}
                                    href={item.url || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`profile-me-social-btn ${!item.url ? "profile-me-social-btn-disabled" : ""}`}
                                    style={{ backgroundColor: item.url ? item.color : "#6c757d" }}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Favorites */}
            <div className="profile-me-card">
                <div className="profile-me-favorites-header">
                    <h4 className="profile-me-favorites-title">Phim yêu thích</h4>
                </div>

                {!profile.favorites || profile.favorites.length === 0 ? (
                    <div className="profile-me-empty-favorites">Chưa có phim yêu thích.</div>
                ) : (
                    <div className="profile-me-favorites-grid">
                        {profile.favorites.map((f, idx) => (
                            <div className="profile-me-favorite-item" key={idx}>
                                <div className="profile-me-favorite-title">{f.title}</div>
                                <div className="profile-me-favorite-rating">
                                    ⭐ {f.rating ?? 0} — {f.reviewCount ?? 0} đánh giá
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recommendations */}
            <div className="profile-me-card rec-card">
                <div className="rec-header">
                    <h4 className="rec-title" style={{ color: "white" }}>🎬 Phim đề xuất cho bạn</h4>

                    <div className="rec-sub">
                        <span className="rec-chip" style={{ color: "white" }}>
                            📚 Thể loại nổi bật: <b className="rec-strong" style={{ color: "white" }}>{topGenreLabel}</b>
                        </span>
                        <span className="rec-chip" style={{ color: "white", marginLeft: 12 }}>
                            🧑‍🎤 Diễn viên nổi bật: <b className="rec-strong" style={{ color: "white" }}>{topActorLabel}</b>
                        </span>
                    </div>
                </div>

                <div className="rec-columns">
                    {/* By Genre */}
                    <div className="rec-col">
                        <div className="rec-col-title" style={{ color: "white" }}>📗 Theo thể loại:</div>

                        {!recs?.byTopGenre || recs.byTopGenre.length === 0 ? (
                            <div className="rec-empty" style={{ color: "white" }}>Không có đề xuất theo thể loại.</div>
                        ) : (
                            <ul className="rec-list">
                                {recs.byTopGenre.map((m) => (
                                    <li key={m.movieId} className="rec-item" style={{ color: "white" }}>
                                        <span className="rec-movie" style={{ color: "white" }}>{m.title}</span>
                                        <span className="rec-meta" style={{ color: "white", marginLeft: 8 }}>
                                            ⭐ {m.avgRating} • {m.releaseDate}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* By Actor */}
                    <div className="rec-col">
                        <div className="rec-col-title" style={{ color: "white" }}>🎭 Theo diễn viên:</div>

                        {!recs?.byTopActor || recs.byTopActor.length === 0 ? (
                            <div className="rec-empty" style={{ color: "white" }}>Không có đề xuất theo diễn viên.</div>
                        ) : (
                            <ul className="rec-list">
                                {recs.byTopActor.map((m) => (
                                    <li key={m.movieId} className="rec-item" style={{ color: "white" }}>
                                        <span className="rec-movie" style={{ color: "white" }}>{m.title}</span>
                                        <span className="rec-meta" style={{ color: "white", marginLeft: 8 }}>
                                            ⭐ {m.avgRating} • {m.releaseDate}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
