import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchSessions() {
  const { data } = await api.get('/sessions');
  return data;
}

export async function fetchSessionEvents(sessionId) {
  const { data } = await api.get(`/sessions/${sessionId}`);
  return data;
}

export async function fetchHeatmap(pageUrl) {
  const { data } = await api.get('/heatmap', {
    params: { pageUrl },
  });
  return data;
}

export async function fetchPageUrls() {
  const { data } = await api.get('/pages');
  return data;
}

export default api;
