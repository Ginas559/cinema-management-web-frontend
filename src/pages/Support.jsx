import React, { useState, useEffect, useRef } from "react";
import "../styles/Support.css";
import { getMessages, receiveMessage } from "../services/SupportService";
import { useAuth } from "../hooks/useAuth";
import step1Image1 from '../assets/images/Sup/1.png';
import step1Image2 from '../assets/images/Sup/2.png';
import step1Image3 from '../assets/images/Sup/3.png';
import step1Image4 from '../assets/images/Sup/4.png';
import step1Image5 from '../assets/images/Sup/5.png';
import step1Image6 from '../assets/images/Sup/6.png';
import TimeTable from "../components/modals/operation/TimeTable";

export default function Support() {
    const { user, sendForgotPasswordOtp, verifyOtpAndResetPassword } = useAuth();
    const namechat = user ? user.username : "Chưa login";
    const rolechat = user ? user.role : "Guest";

    const [selectedUser, setSelectedUser] = useState(null);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState("");
    const [activeSection, setActiveSection] = useState(null);

    const [chatInput, setChatInput] = useState("");
    const [messagesList, setMessagesList] = useState([]);
    const chatBoxRef = useRef(null);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 1000);
        return () => clearInterval(interval);
    }, []);

    const [autoScroll, setAutoScroll] = useState(true);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        setAutoScroll(isAtBottom);
    };

    useEffect(() => {
        if (autoScroll && chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messagesList]);

    const loadMessages = async () => {
        try {
            const res = await getMessages();
            setMessagesList(res);
        } catch (err) {
            console.error("Lỗi load tin nhắn:", err);
        }
    };

    const handleSendOtp = async () => {
        try {
            const res = await sendForgotPasswordOtp(email);
            setMessage(res.message);
            setStep(2);
        } catch (err) {
            setMessage(err.response?.data?.message || "Lỗi gửi OTP!");
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const res = await verifyOtpAndResetPassword(email, otp, newPassword);
            setMessage(res.message);
            setStep(3);
        } catch (err) {
            setMessage(err.response?.data?.message || "Lỗi xác minh OTP!");
        }
    };

    const handleSendChat = async (chatType) => {
        if (!chatInput.trim()) return;

        let roleSend = rolechat;
        let role = "";

        if (chatType === 3) {
            role = "CUSTOMER";
        }

        if (chatType === 4) {
            if (rolechat === "ADMIN" && selectedUser) {
                roleSend = `ADMIN-${selectedUser}`; 
                role = "ADMIN";
            } else {
                roleSend = rolechat;
                role = "ADMIN";
            }
        }

        try {
            await receiveMessage(namechat, chatInput, roleSend, role);
            setChatInput("");
            await loadMessages();
        } catch (err) {
            console.error("Lỗi gửi chat:", err);
        }
    };

    const isRestrictedRole = rolechat === "STAFF" || rolechat === "MANAGER";

    return (
        <div className="support-container">
            <h1>Trang Hỗ Trợ</h1>

            {activeSection === null ? (
                <div className="support-buttons">
                    <button onClick={() => setActiveSection(1)}>1️⃣ Quên mật khẩu</button>
                    <button onClick={() => setActiveSection(2)}>2️⃣ Hướng dẫn</button>
                    <button onClick={() => setActiveSection(3)}>3️⃣ Chat với người khác</button>

                    {/* Ẩn tab 4 nếu là STAFF hoặc MANAGER */}
                    {!isRestrictedRole && (
                        <button onClick={() => setActiveSection(4)}>4️⃣ Hỏi admin</button>
                    )}

                    {isRestrictedRole && (
                        <button onClick={() => setActiveSection(5)}>5️⃣ Time Table</button>
                    )}
                </div>
            ) : (
                <>
                    <button
                        className="support-back-button"
                        onClick={() => {
                            setActiveSection(null);
                            setStep(1);
                            setMessage("");
                        }}
                    >
                        ⬅ Quay lại
                    </button>

                    {/* Quên mật khẩu */}
                    {activeSection === 1 && (
                        <section className="support-section support-section-forgot">
                            <h2>1️⃣ Quên mật khẩu</h2>
                            {step === 1 && (
                                <div className="support-forgot-step">
                                    <input
                                        type="email"
                                        placeholder="Nhập email của bạn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <button onClick={handleSendOtp}>Gửi OTP</button>
                                </div>
                            )}
                            {step === 2 && (
                                <div className="support-verify-step">
                                    <input
                                        type="text"
                                        placeholder="Nhập mã OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Nhập mật khẩu mới"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <button onClick={handleVerifyOtp}>Đặt lại mật khẩu</button>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="support-success-step">
                                    <p>Mật khẩu đã được đặt lại thành công!</p>
                                </div>
                            )}
                            {message && <p className="support-message">{message}</p>}
                        </section>
                    )}

                    {/* Hướng dẫn */}
                    {activeSection === 2 && (
                        <section className="support-section support-section-guide">
                            <h2>2️⃣ Hướng dẫn Chọn phim</h2>
                            <p>Hình ảnh minh họa bước 1 của hướng dẫn chọn phim</p>
                            <img src={step1Image1} alt="Chọn phim" />
                            <p></p>
                            <p>Hình ảnh minh họa bước 2 của Chọn suất Chiếu</p>
                            <img src={step1Image2} alt="Chọn suất chiếu" />
                            <p></p>
                            <p>Hình ảnh minh họa bước 3 của Chọn Ghế</p>
                            <img src={step1Image3} alt="Chọn ghế" />
                            <p></p>
                            <p>Hình ảnh minh họa bước 4 Xem hóa đơn thành tiền</p>
                            <img src={step1Image4} alt="Hóa đơn" />
                            <p></p>
                            <p>Hình ảnh minh họa bước 5 của Xem Hóa đơn</p>
                            <img src={step1Image5} alt="Xem hóa đơn" />
                            <p></p>
                            <p>Hình ảnh minh họa bước 6 của Xem lịch sử booking</p>
                            <img src={step1Image6} alt="Lịch sử booking" />
                            <p></p>
                        </section>
                    )}

                    {/* Chat với người khác */}
                    {activeSection === 3 && (
                        <section className="support-section support-section-chat">
                            <h2>3️⃣ Chat với người khác</h2>
                            <div className="support-chat-box" ref={chatBoxRef} onScroll={handleScroll}>
                                {messagesList
                                    .filter((m) => m.role === "CUSTOMER")
                                    .map((m, i) => (
                                        <div
                                            key={i}
                                            className={`support-chat-message ${m.name === namechat ? "support-mine" : "support-other"}`}
                                        >
                                            <strong>
                                                {m.roleSend === "ADMIN" ? "Quản trị viên" : m.name}:
                                            </strong>{" "}
                                            {m.message}
                                        </div>
                                    ))}
                            </div>
                            <div className="support-chat-input-area">
                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn của bạn..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                />
                                <button onClick={() => handleSendChat(3)}>Gửi</button>
                            </div>
                        </section>
                    )}

                    {/* Hỏi admin */}
                    {!isRestrictedRole && activeSection === 4 && (
                        <section className="support-section support-section-ask-admin">
                            <h2>4️⃣ Hỏi admin</h2>

                            {/* ADMIN XEM DANH SÁCH NGƯỜI DÙNG */}
                            {rolechat === "ADMIN" && !selectedUser && (
                                <div className="support-user-list">
                                    <h3>Danh sách người dùng:</h3>
                                    {Array.from(
                                        new Set(
                                            messagesList
                                                .filter((m) => m.role === "ADMIN")
                                                .map((m) => m.name)
                                        )
                                    ).map((username, i) => (
                                        <button
                                            key={i}
                                            className="support-user-item"
                                            onClick={() => setSelectedUser(username)}
                                        >
                                            💬 {username}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ADMIN CHAT VỚI NGƯỜI DÙNG */}
                            {rolechat === "ADMIN" && selectedUser && (
                                <>
                                    <button
                                        className="support-back-button"
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        ⬅ Quay lại danh sách
                                    </button>
                                    <div className="support-chat-box" ref={chatBoxRef} onScroll={handleScroll}>
                                        {messagesList
                                            .filter(
                                                (m) =>
                                                    m.role === "ADMIN" &&
                                                    (m.name === selectedUser ||
                                                        m.roleSend === `ADMIN-${selectedUser}`)
                                            )
                                            .map((m, i) => (
                                                <div
                                                    key={i}
                                                    className={`support-chat-message ${m.name === namechat ? "support-mine" : "support-other"}`}
                                                >
                                                    <strong>{m.name}:</strong> {m.message}
                                                </div>
                                            ))}
                                    </div>
                                    <div className="support-chat-input-area">
                                        <textarea
                                            placeholder={`Nhập tin nhắn cho ${selectedUser}...`}
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                        />
                                        <button onClick={() => handleSendChat(4)}>Gửi</button>
                                    </div>
                                </>
                            )}

                            {/* NGƯỜI DÙNG CHAT VỚI ADMIN */}
                            {rolechat !== "ADMIN" && (
                                <>
                                    <div className="support-chat-box" ref={chatBoxRef}>
                                        {messagesList
                                            .filter(
                                                (m) =>
                                                    m.role === "ADMIN" &&
                                                    (m.name === namechat ||
                                                        m.roleSend === `ADMIN-${namechat}`)
                                            )
                                            .map((m, i) => (
                                                <div
                                                    key={i}
                                                    className={`support-chat-message ${m.name === namechat ? "support-mine" : "support-other"}`}
                                                >
                                                    <strong>{m.name}:</strong> {m.message}
                                                </div>
                                            ))}
                                    </div>
                                    <div className="support-chat-input-area">
                                        <textarea
                                            placeholder="Nhập câu hỏi của bạn cho admin..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                        />
                                        <button onClick={() => handleSendChat(4)}>Gửi</button>
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {/* Time Table */}
                    {isRestrictedRole && activeSection === 5 && (
                        <TimeTable />
                    )}
                </>
            )}
        </div>
    );
}