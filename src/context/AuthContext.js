import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { loginRequest, sendOtpRequest, verifyOtpRequest, sendForgotPasswordOtp, verifyOtpAndResetPassword } from "../services/AuthService";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const navigate = useNavigate();

  const openLoginModal = () => setShowLogin(true);
  const closeLoginModal = () => setShowLogin(false);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          username: decoded.sub,
          role: decoded.role,
          accountId: decoded.user_id,
        });
      } catch (error) {
        console.error("Invalid Token");
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (username, password, rememberMe = true) => {
    try {
      const token = await loginRequest(username, password);
      setToken(token);
      const decoded = jwtDecode(token);

      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("username", decoded.sub);
        localStorage.setItem("role", decoded.role);
        localStorage.setItem("accountId", decoded.user_id);
        sessionStorage.clear();
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("username", decoded.sub);
        sessionStorage.setItem("role", decoded.role);
        sessionStorage.setItem("accountId", decoded.user_id);
        localStorage.clear();
      }

      return token;
    } catch (err) {
      console.error("Login failed:", err.message);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const sendOtp = async (userData) => {
    try {
      const res = await sendOtpRequest(userData);
      console.log("OTP sent:", res);
      return res;
    } catch (err) {
      console.error("Send OTP failed:", err);
      if (err.response?.data?.errors) {
        throw new Error(JSON.stringify(err.response.data.errors));
      }
      throw err;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await verifyOtpRequest(email, otp);
      return res;
    } catch (err) {
      console.error("Verify OTP failed:", err);
      if (err.response?.data?.errors) {
        throw new Error(JSON.stringify(err.response.data.errors));
      }
      throw err;
    }
  };

  const sendForgotPassword = async (email) => {
    try {
      const res = await sendForgotPasswordOtp(email);
      console.log("Forgot password OTP sent:", res);
      return res;
    } catch (err) {
      console.error("Send forgot password OTP failed:", err);
      if (err.response?.data?.errors) {
        throw new Error(JSON.stringify(err.response.data.errors));
      }
      throw err;
    }
  };

  const verifyForgotPassword = async (email, otp, newPassword) => {
    try {
      const res = await verifyOtpAndResetPassword(email, otp, newPassword);
      console.log("Password reset success:", res);
      return res;
    } catch (err) {
      console.error("Verify forgot password OTP failed:", err);
      if (err.response?.data?.errors) {
        throw new Error(JSON.stringify(err.response.data.errors));
      }
      throw err;
    }
  };


  useEffect(() => {
    const savedToken =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        sendOtp,
        verifyOtp,
        sendForgotPassword,
        verifyForgotPassword,
        showLogin,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
