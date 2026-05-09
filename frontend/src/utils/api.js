import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 429) {
      window.location.href = '/locked';
    }
    return Promise.reject(error);
  }
);

export default api;
