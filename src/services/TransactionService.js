import api from "./api";

export async function searchBillsByCustomerInfo(email, phoneNumber, page = 0, size = 10) {
    const params = {};
    if (email) params.email = email;
    if (phoneNumber) params.phoneNumber = phoneNumber;
    params.page = page;
    params.size = size;

    const res = await api.get("/api/Transactions/bills/search", { params });
    return res.data;
}