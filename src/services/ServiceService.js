import api from "./api";

export const getAllServices = async () => {
  const response = await api.get("/api/services");
  return response.data;
};

export const createService = async (service) => {
  const response = await api.post("/api/services", service);
  return response.data;
};

export const updateService = async (serviceId, service) => {
  const response = await api.put(`/api/services/${serviceId}`, service);
  return response.data;
};
