import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadAvatar } from "../../../services/ProfileService";
import { AuthContext } from "../../../context/AuthContext";
import "../../../styles/upload-avatar.css"; 

export default function UploadAvatar() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!["image/jpeg", "image/png", "image/gif"].includes(f.type)) {
      setMsg("❌ Chỉ chấp nhận ảnh JPG, PNG hoặc GIF");
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setMsg("❌ Kích thước tối đa là 5MB");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg("");
  };

  const handleUpload = async () => {
    if (!file || !user?.accountId) return;

    try {
      setUploading(true);
      const result = await uploadAvatar(user.accountId, file);
      setMsg("✅ Cập nhật avatar thành công!");
      setTimeout(() => navigate("/prof", { state: { newAvatar: result.imageUrl } }), 900);
    } catch (err) {
      console.log("UPLOAD avatar error:", err?.response?.status, err?.response?.data || err);
      setMsg("❌ Lỗi upload. Kiểm tra BE hoặc Cloudinary.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-avatar-container">
      <div className="upload-avatar-modal">
        <h2 className="upload-avatar-title">Tải ảnh đại diện mới</h2>

        <div className="upload-avatar-upload-area">
          {preview ? (
            <img src={preview} alt="preview" className="upload-avatar-preview" />
          ) : (
            <div className="upload-avatar-placeholder">
              <svg className="upload-avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Chưa chọn ảnh</p>
            </div>
          )}

          <div className="upload-avatar-file-input-wrapper">
            <label className="upload-avatar-file-label">
              <input type="file" accept="image/*" onChange={handleSelect} className="upload-avatar-file-input" />
              <span className="upload-avatar-file-button">Chọn ảnh</span>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`upload-avatar-btn-upload ${!file || uploading ? "upload-avatar-btn-disabled" : ""}`}
          >
            {uploading ? "Đang tải lên..." : "Tải lên"}
          </button>

          {msg && (
            <div className={`upload-avatar-message ${msg.includes("✅") ? "upload-avatar-success" : "upload-avatar-error"}`}>
              {msg}
            </div>
          )}
        </div>

        <button onClick={() => navigate("/prof")} className="upload-avatar-back-button">
          ← Quay lại trang hồ sơ
        </button>
      </div>
    </div>
  );
}
