import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../../../services/ProfileService";
import "../../../styles/upload-avatar.css";


export default function UpdateInfo() {
    const { user } = useContext(AuthContext);
    const accountId = user?.accountId;
    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: "",
        facebookUrl: "",
        instagramUrl: "",
        twitterUrl: "",
        linkedInUrl: "",
    });
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            if (!accountId) {
                setLoading(false);
                return;
            }
            try {
                const data = await getProfile(accountId);
                setForm({
                    fullName: data.fullName || "",
                    facebookUrl: data.facebookUrl || "",
                    instagramUrl: data.instagramUrl || "",
                    twitterUrl: data.twitterUrl || "",
                    linkedInUrl: data.linkedInUrl || "",
                });
            } catch {
                setMsg("Không tải được dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [accountId]);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!accountId) return;

        try {
            setLoading(true);
            await updateProfile(accountId, form);
            setMsg("✅ Đã lưu thay đổi!");
            setTimeout(() => navigate("/prof"), 1000);
        } catch {
            setMsg("❌ Lưu thất bại, thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    if (!accountId) {
        return (
            <div style={styles.container}>
                <div style={styles.textCenter}>Chưa đăng nhập.</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.textCenter}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Cập nhật thông tin cá nhân</h2>

                <form onSubmit={onSubmit} style={styles.form}>
                    {/* Họ tên */}
                    <div style={styles.group}>
                        <label style={styles.label}>Họ tên</label>
                        <input
                            type="text"
                            name="fullName"
                            value={form.fullName}
                            onChange={onChange}
                            placeholder="Nhập họ tên đầy đủ"
                            style={styles.input}
                        />
                    </div>

                    {/* Mạng xã hội */}
                    <h4 style={styles.subtitle}>Liên kết mạng xã hội</h4>
                    <div style={styles.grid}>
                        {[
                            { label: "Facebook", key: "facebookUrl", hint: "https://facebook.com/..." },
                            { label: "Instagram", key: "instagramUrl", hint: "https://instagram.com/..." },
                            { label: "Twitter", key: "twitterUrl", hint: "https://twitter.com/..." },
                            { label: "LinkedIn", key: "linkedInUrl", hint: "https://linkedin.com/in/..." },
                        ].map((item) => (
                            <div key={item.key} style={styles.group}>
                                <label style={styles.label}>{item.label}</label>
                                <input
                                    type="url"
                                    name={item.key}
                                    value={form[item.key]}
                                    onChange={onChange}
                                    placeholder={item.hint}
                                    style={styles.input}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={styles.btnBox}>
                        <button type="submit" style={{ ...styles.btn, ...styles.btnSave }}>
                            💾 Lưu thay đổi
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/prof")}
                            style={{ ...styles.btn, ...styles.btnCancel }}
                        >
                            ↩ Hủy bỏ
                        </button>
                    </div>

                    {/* Message */}
                    {msg && (
                        <div
                            style={{
                                ...styles.msg,
                                ...(msg.includes("✅") ? styles.msgSuccess : styles.msgError),
                            }}
                        >
                            {msg}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

/* 🎨 Inline CSS styles */
const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#0b1524",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 10px",
        color: "#e0e0e0",
    },
    card: {
        backgroundColor: "#1e2635",
        borderRadius: "16px",
        padding: "30px 40px",
        width: "100%",
        maxWidth: "720px",
        boxShadow: "0 0 20px rgba(0,0,0,0.4)",
    },
    title: {
        textAlign: "center",
        color: "#00bfff",
        marginBottom: "25px",
        fontWeight: "600",
    },
    subtitle: {
        color: "#00bfff",
        fontSize: "1rem",
        margin: "20px 0 10px",
        borderBottom: "1px solid #00bfff44",
        paddingBottom: "5px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
    },
    group: {
        display: "flex",
        flexDirection: "column",
        marginBottom: "15px",
    },
    label: {
        marginBottom: "6px",
        fontSize: "0.95rem",
        color: "#a9c8ff",
    },
    input: {
        padding: "10px 12px",
        border: "1px solid #2f3b52",
        borderRadius: "8px",
        background: "#141b29",
        color: "#e0e0e0",
        outline: "none",
        transition: "all 0.2s",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "15px",
    },
    inputFocus: {
        borderColor: "#00bfff",
        boxShadow: "0 0 4px #00bfff55",
    },
    btnBox: {
        display: "flex",
        justifyContent: "center",
        gap: "15px",
        marginTop: "25px",
    },
    btn: {
        padding: "10px 20px",
        fontWeight: "500",
        borderRadius: "8px",
        cursor: "pointer",
        border: "none",
        transition: "all 0.2s",
    },
    btnSave: {
        backgroundColor: "#00bfff",
        color: "#fff",
    },
    btnCancel: {
        backgroundColor: "#2f3b52",
        color: "#d0d0d0",
    },
    msg: {
        marginTop: "20px",
        textAlign: "center",
        padding: "10px",
        borderRadius: "8px",
        fontWeight: "500",
    },
    msgSuccess: {
        background: "#1d3b2a",
        color: "#6fffb0",
    },
    msgError: {
        background: "#3b1e1e",
        color: "#ff7f7f",
    },
    textCenter: {
        color: "#fff",
        fontSize: "1.1rem",
        marginTop: "100px",
    },
};
