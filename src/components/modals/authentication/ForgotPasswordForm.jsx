import { useState } from "react";
import { Mail, X, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import "../../../styles/forgot-password-form.css";

export function ForgotPasswordForm({ onClose, onSwitchToLogin }) {
  const { sendForgotPassword, verifyForgotPassword } = useAuth();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (setter, fieldName) => (e) => {
    setter(e.target.value);
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
    if (message) setMessage("");
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: "" }));
    }
  };

  const validateEmail = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!otp.trim()) {
      newErrors.otp = "OTP code is required";
    } else if (otp.length !== 6) {
      newErrors.otp = "OTP must be 6 digits";
    }
    
    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setMessage("");
    setErrors({});

    try {
      console.log("Sending OTP to:", email);
      const res = await sendForgotPassword(email);
      console.log("OTP Response:", res);
      
      setMessage(res.message || "OTP sent successfully! Please check your email.");
      setStep(2);
    } catch (err) {
      console.error("OTP Error Full:", err);
      console.error("OTP Error Response:", err.response);
      
      let errorMessage = "Failed to send OTP. Please try again.";
      
      if (err.response?.data) {
        // Backend trả về errors object
        if (err.response.data.errors) {
          const backendErrors = err.response.data.errors;
          // Nếu có lỗi email cụ thể
          if (backendErrors.email) {
            setErrors({ email: backendErrors.email });
            return;
          }
          // Hiển thị lỗi đầu tiên
          errorMessage = Object.values(backendErrors)[0];
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = err.message || "An unexpected error occurred.";
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setIsLoading(true);
    setMessage("");
    setErrors({});

    try {
      console.log("Verifying OTP for:", email);
      // Backend expects: { email, otp, newPassword }
      const res = await verifyForgotPassword(email, otp, newPassword);
      console.log("Verify Response:", res);
      
      setMessage(res.message || "Password reset successfully!");
      setStep(3);
    } catch (err) {
      console.error("Verify Error Full:", err);
      console.error("Verify Error Response:", err.response);
      
      let errorMessage = "Failed to verify OTP. Please try again.";
      
      if (err.response?.data) {
        if (err.response.data.errors) {
          const backendErrors = err.response.data.errors;
          // Xử lý từng loại lỗi cụ thể
          if (backendErrors.otp) {
            setErrors({ otp: backendErrors.otp });
            return;
          }
          if (backendErrors.email) {
            setErrors({ general: backendErrors.email });
            return;
          }
          errorMessage = Object.values(backendErrors)[0];
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = err.message || "An unexpected error occurred.";
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep(1);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setMessage("");
    onSwitchToLogin();
  };

  const handleTryAgain = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setMessage("");
  };

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-modal register">
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="forgot-password-header">
          {step === 1 && (
            <>
              <h2 className="forgot-password-title">Forgot Password?</h2>
              <p className="forgot-password-subtitle">
                Enter your registered email address to receive an OTP code
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="forgot-password-title">Verify OTP</h2>
              <p className="forgot-password-subtitle">
                Enter the 6-digit OTP code sent to <strong>{email}</strong>
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="forgot-password-title">Password Reset Successful!</h2>
              <p className="forgot-password-subtitle">
                Your password has been successfully reset
              </p>
            </>
          )}
        </div>

        <div className="forgot-password-form">
          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <>
              {errors.general && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  <span>{errors.general}</span>
                </div>
              )}
              {message && (
                <div className="success-banner">
                  <Check size={16} />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleChange(setEmail, "email")}
                      className="forgot-password-input"
                      placeholder="Enter your registered email"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <div className="form-error">{errors.email}</div>}
                  <p className="form-hint">
                    We'll send a 6-digit OTP code to this email address
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="forgot-password-btn"
                >
                  {isLoading ? (
                    <div className="loading-content">
                      <div className="spinner"></div>
                      Sending OTP...
                    </div>
                  ) : (
                    "Send OTP Code"
                  )}
                </button>
              </form>

              <div className="forgot-password-switch">
                Remember your password?{" "}
                <button
                  type="button"
                  className="forgot-password-switch-btn"
                  onClick={onSwitchToLogin}
                  disabled={isLoading}
                >
                  <ArrowLeft size={16} style={{ marginRight: '4px' }} />
                  Back to Login
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Verify OTP and Set New Password */}
          {step === 2 && (
            <>
              {errors.general && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  <span>{errors.general}</span>
                </div>
              )}
              {message && (
                <div className="success-banner">
                  <Check size={16} />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">OTP Code *</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="otp"
                      value={otp}
                      onChange={handleChange(setOtp, "otp")}
                      className="forgot-password-input"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={isLoading}
                      autoComplete="one-time-code"
                    />
                  </div>
                  {errors.otp && <div className="form-error">{errors.otp}</div>}
                  <p className="form-hint">
                    OTP is valid for 5 minutes
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      name="newPassword"
                      value={newPassword}
                      onChange={handleChange(setNewPassword, "newPassword")}
                      className="forgot-password-input"
                      placeholder="Enter new password"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleChange(setConfirmPassword, "confirmPassword")}
                      className="forgot-password-input"
                      placeholder="Confirm new password"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="forgot-password-btn"
                >
                  {isLoading ? (
                    <div className="loading-content">
                      <div className="spinner"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <div className="forgot-password-switch">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  className="forgot-password-switch-btn"
                  onClick={handleTryAgain}
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <>
              <div className="success-message">
                <div className="success-icon">
                  <Check size={32} />
                </div>
                <p>
                  Your password has been successfully reset for <strong>{email}</strong>
                </p>
                <p>
                  You can now log in with your new password.
                </p>
              </div>

              <button
                onClick={handleBackToLogin}
                className="forgot-password-btn"
              >
                <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}