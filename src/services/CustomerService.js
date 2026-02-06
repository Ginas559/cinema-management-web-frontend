import api from "./api";

export const getCustomers = async (params = {}) => {
    const res = await api.get("/api/customers", { params });
    return res.data;
};

export const getCustomerBills = async (customerId, movieTitle = "") => {
    const res = await api.get(`/api/customers/transactions/${customerId}`, {
        params: movieTitle ? { movieTitle } : {},
    });
    return res.data;
};

export const updateCustomer = async (customerId, payload) => {
    const res = await api.put(`/api/customers/${customerId}`, payload);
    return res.data;
};
