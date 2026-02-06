import api from "./api";

export const createBill = async (data) => {
  try {
    const response = await api.post("/api/transactions", data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating bill:", error);
    throw error.response?.data || { message: "Bill creation failed" };
  }
};

export const getBillsByAccount = async (accountId) => {
  try {
    const response = await api.get(`/api/transactions/${accountId}`);
    
    return response.data; 
  } catch (error) {
    console.error("Error fetching bills:", error);
    throw error;
  }
};



export const AddBillEmployee = async (BillId, EmID) => {
    const res = await api.get(`/api/transactions/AddEmployee`, {
        params: { BillId, EmID },
    });
    return res.data;
};

