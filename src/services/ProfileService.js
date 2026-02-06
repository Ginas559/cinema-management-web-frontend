import api from "./api";

export const getProfile = async (accountId) => {
  const res = await api.get(`/api/profiles/${accountId}`);
  return res.data;
};

export const updateProfile = async (accountId, body) => {
  const res = await api.put(`/api/profiles/${accountId}`, body);
  return res.data;
};

export const getFavoritesTop = async (accountId, limit = 5) => {
  const res = await api.get(`/api/profiles/${accountId}/favorites/top`, {
    params: { limit },
  });
  return res.data;
};

export const uploadAvatar = async (accountId, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.put(`/api/profiles/${accountId}/avatar`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getSimpleRecommendations = async (accountId, k = 3) => {
    const res = await api.get(`/api/profiles/${accountId}/recommendations/simple`, {
        params: { k },
    });
    return res.data; // { byTopGenre: [], byTopActor: [] }
};

