import api from "./api"; 

export const createPaymentRequest = async (amount, orderInfo) => {
  try {
    const params = new URLSearchParams();
    params.append("amount", amount);
    params.append("orderInfo", orderInfo);

    const response = await api.post("/api/payment/createPay", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", 
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};
