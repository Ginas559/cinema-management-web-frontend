import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/search';

const searchApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function expandQuery(query) {
  try {
    const response = await searchApi.get('/expand', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error expanding query:', error);
    throw error;
  }
}

export async function searchMovies(query, topK = 20) {
  try {
    const response = await searchApi.get('/movies', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
}

export async function searchTopMovies(query, topK = 10) {
  try {
    const response = await searchApi.get('/movies/top', {
      params: { q: query, top_k: topK }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching top movies:', error);
    throw error;
  }
}

export default {
  expandQuery,
  searchMovies,
  searchTopMovies,
};