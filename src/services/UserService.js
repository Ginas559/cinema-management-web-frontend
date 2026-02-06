import api from "./api";

export async function getAllServices() {
	const res = await api.get("/api/services");
	return res.data;
}