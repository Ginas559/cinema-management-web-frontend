import { useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff, X } from "lucide-react";
import "../../../styles/login-form.css";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { jwtDecode } from "jwt-decode";

export function LoginForm({ onClose, onSwitchToRegister, useAuth }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isRememberMe, setIsRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUsername = localStorage.getItem("username") || sessionStorage.getItem("username");

    if (savedToken && savedUsername) {
      setFormData({ username: savedUsername, password: "" });
      setIsRememberMe(!!localStorage.getItem("token"));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRememberMeChange = (e) => setIsRememberMe(e.target.checked);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = await login(formData.username, formData.password, isRememberMe);
      const decoded = jwtDecode(token);

      setFormData({ username: decoded.sub, password: "" });
      onClose();
    } catch (error) {
      setErrors({ general: "Invalid username or password" });
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword)
    return (
      <ForgotPasswordForm
        onClose={onClose}
        onSwitchToLogin={() => setShowForgotPassword(false)}
      />
    );

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="login-header">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your CinemUTE account</p>
        </div>

        <div className="login-form">
          {errors.general && <div className="error-banner">{errors.general}</div>}

          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="login-input"
                placeholder="Enter your username"
              />
            </div>
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="login-input"
                placeholder="Enter your password"
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

          {/* Options */}
          <div className="form-options">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={isRememberMe}
                onChange={handleRememberMeChange}
              />
              Remember me
            </label>
            <button
              type="button"
              className="forgot-link"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="login-btn"
          >
            {isLoading ? (
              <div className="loading-content">
                <div className="spinner"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Switch */}
          <div className="login-switch">
            Don't have an account?{" "}
            <button
              type="button"
              className="login-switch-btn"
              onClick={onSwitchToRegister}
            >
              Sign up here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
