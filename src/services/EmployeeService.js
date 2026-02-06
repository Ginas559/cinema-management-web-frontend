import api from "./api";

export const getEmployees = async (search = "") => {
    const res = await api.get("/api/employees", { params: { search } });
    return res.data;
};

export const createEmployee = async (payload) => {
    const res = await api.post("/api/employees", payload);
    return res.data;
};

export const updateEmployee = async (id, payload) => {
    const res = await api.put(`/api/employees/${id}`, payload);
    return res.data;
};