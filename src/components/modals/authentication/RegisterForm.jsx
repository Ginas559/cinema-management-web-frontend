import { useState } from "react";
import { User, Lock, Mail, Phone, Eye, EyeOff, X, Calendar } from "lucide-react";
import "../../../styles/register-form.css";
import { useAuth } from "../../../hooks/useAuth";

export function RegisterForm({ onClose, onSwitchToLogin }) {
  const { sendOtp, verifyOtp } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    role: "CUSTOMER",
    businessCode: "",
  });
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCustomer, setIsCustomer] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "role") {
      setIsCustomer(value === "CUSTOMER");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isOtpSent) {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      }

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      }

      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/\s+/g, ""))) {
        newErrors.phoneNumber = "Please enter a valid phone number";
      }

      if (!formData.role) {
        newErrors.role = "Role is required";
      }

      // Validate business code cho employee
      if (!isCustomer && !formData.businessCode.trim()) {
        newErrors.businessCode = "Business code is required for employees";
      }
    } else {
      if (!otp.trim()) {
        newErrors.otp = "OTP is required";
      } else if (!/^[0-9]{6}$/.test(otp)) {
        newErrors.otp = "OTP must be 6 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * BƯỚC 1: Gửi OTP
   */
  const handleSendOtp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Chuẩn bị data để gửi
      const dataToSend = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        role: formData.role,
      };

      // Thêm businessCode nếu không phải customer
      if (!isCustomer) {
        dataToSend.businessCode = formData.businessCode;
      }

      await sendOtp(dataToSend);
      
      setIsOtpSent(true);
      setSuccessMessage(`OTP has been sent to ${formData.email}`);
      
      // Xóa success message sau 5 giây
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Send OTP error:", error);
      
      // Xử lý lỗi validation từ backend
      try {
        const backendErrors = JSON.parse(error.message);
        setErrors(backendErrors);
      } catch {
        setErrors({
          general: error.response?.data?.message || "Failed to send OTP. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * BƯỚC 2: Verify OTP và đăng ký
   */
  const handleVerifyOtpAndRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await verifyOtp(formData.email, otp);
      
      // Hiển thị thông báo thành công
      setSuccessMessage(result.message || "Registration successful!");
      
      // Chuyển về login sau 2 giây
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (error) {
      console.error("Verify OTP error:", error);
      
      // Xử lý lỗi validation từ backend
      try {
        const backendErrors = JSON.parse(error.message);
        setErrors(backendErrors);
      } catch {
        setErrors({
          otp: error.response?.data?.errors?.otp || "Invalid or expired OTP",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isOtpSent) {
      await handleVerifyOtpAndRegister();
    } else {
      await handleSendOtp();
    }
  };

  return (
    <div className="register-overlay">
      <div className="register-modal register">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="register-header">
          <h2 className="register-title">Join CinemUTE</h2>
          <p className="register-subtitle">
            {isOtpSent
              ? "Enter the OTP sent to your email"
              : "Create your account to start your cinema journey"}
          </p>
        </div>

        <div className="register-form">
          {/* Success Message */}
          {successMessage && (
            <div className="success-banner">{successMessage}</div>
          )}

          {/* General Error */}
          {errors.general && <div className="error-banner">{errors.general}</div>}

          {!isOtpSent ? (
            <>
              {/* Username + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && <div className="form-error">{errors.username}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>
              </div>

              {/* Password + Confirm Password */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="form-error">{errors.confirmPassword}</div>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="register-input"
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && <div className="form-error">{errors.fullName}</div>}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <div className="input-wrapper">
                  <Calendar className="input-icon" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="register-input"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {errors.dateOfBirth && <div className="form-error">{errors.dateOfBirth}</div>}
              </div>

              {/* Phone Number + Role */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  {errors.phoneNumber && <div className="form-error">{errors.phoneNumber}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <div className="input-wrapper">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="register-input"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="STAFF">STAFF</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  {errors.role && <div className="form-error">{errors.role}</div>}
                </div>
              </div>

              {/* Business Code (chỉ hiện khi không phải CUSTOMER) */}
              {!isCustomer && (
                <div className="form-group">
                  <label className="form-label">Business Code *</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type="text"
                      name="businessCode"
                      value={formData.businessCode}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Enter code to identify your role"
                    />
                  </div>
                  {errors.businessCode && (
                    <div className="form-error">{errors.businessCode}</div>
                  )}
                </div>
              )}
            </>
          ) : (
            // OTP Input
            <div className="form-group">
              <label className="form-label">OTP *</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (errors.otp) {
                      setErrors((prev) => ({ ...prev, otp: "" }));
                    }
                  }}
                  className="register-input"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>
              {errors.otp && <div className="form-error">{errors.otp}</div>}
              
              <button
                type="button"
                className="resend-otp-btn"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp("");
                  setErrors({});
                }}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </div>
          )}

          <button onClick={handleSubmit} disabled={isLoading} className="register-btn">
            {isLoading ? (
              <div className="loading-content">
                <div className="spinner"></div>
                {isOtpSent ? "Verifying OTP..." : "Sending OTP..."}
              </div>
            ) : isOtpSent ? (
              "Verify OTP and Register"
            ) : (
              "Send OTP"
            )}
          </button>

          <div className="register-switch">
            Already have an account?{" "}
            <button
              type="button"
              className="register-switch-btn"
              onClick={onSwitchToLogin}
            >
              Sign in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}