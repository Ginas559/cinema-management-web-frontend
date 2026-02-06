import api from "./api";


export async function getMessages() {
    const res = await api.get("/api/support-messages/get-messages");
    return res.data;
}

export async function receiveMessage(name, message, roleSend, role) {
    const res = await api.post("/api/support-messages/receive-message", { name, message, roleSend, role });
    return res.data;
}