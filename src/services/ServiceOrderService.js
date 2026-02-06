import api from "./api";

export const createServiceOrder = async (accountId, phoneNumber) => {
  const params = new URLSearchParams();
  if (accountId) params.append('accountId', accountId);
  if (phoneNumber) params.append('phoneNumber', phoneNumber);

  const res = await api.post(`api/service-orders?${params.toString()}`);
  return res.data;
};

export const addServiceOrderDetails = async (orderId, details) => {
  const res = await api.post(`/api/service-orders/${orderId}/details`, details);
  return res.data;
};

export const getServiceOrderById = async (orderId) => {
  try {
    const res = await api.get(`/api/service-orders/${orderId}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const deleteServiceOrder = async (orderId) => {
  try {
    const res = await api.delete(`/api/service-orders/${orderId}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const deleteServiceOrderDetail = async (detailId) => {
  try {
    const res = await api.delete(`/api/service-orders/details/${detailId}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};
