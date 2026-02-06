import api from "./api";

export async function loginRequest(username, password) {
  const res = await api.post("/auth/login", { username, password });
  return res.data.token; 
}


export async function sendOtpRequest(userData) {
  const res = await api.post("/api/otp/send", userData);
  return res.data; 
}

export async function verifyOtpRequest(email, otp) {
  const res = await api.post("/api/otp/verify", { email, otp });
  return res.data; 
}

export async function sendForgotPasswordOtp(email, otp, newPassword) {
    const res = await api.post("/api/otp/forgot-password/send", { email, otp, newPassword });
    return res.data;
}

export async function verifyOtpAndResetPassword(email, otp, newPassword) {
    const res = await api.post("/api/otp/forgot-password/verify", { email, otp, newPassword });
    return res.data;
}

