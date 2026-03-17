import axios from 'axios';
import { API_BASE } from '../config.js';

const API_BASE_URL = `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sessionToken');
  if (token) {
    config.headers['X-Session-Token'] = token;
  }
  return config;
});

// Auto-refresh access token on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.removeItem('tutorId');
        localStorage.removeItem('sessionToken');
        window.location.href = '/home';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['X-Session-Token'] = token;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = response.data.accessToken;
        localStorage.setItem('sessionToken', newAccessToken);
        processQueue(null, newAccessToken);
        originalRequest.headers['X-Session-Token'] = newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('tutorId');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/home';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const tutorApi = {
  register: (data) => api.post('/tutors/register', data),
  login: (data) => api.post('/tutors/login', data),
  getTutor: (id) => api.get(`/tutors/${id}`),
  updateTutor: (id, data) => api.put(`/tutors/${id}`, data),
  tutorExists: (id) => api.get(`/tutors/${id}/exists`),
  loginExists: (login) => api.get(`/tutors/login/${login}/exists`),
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/tutors/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },
};

export const studentApi = {
  createStudent: (tutorId, data) => api.post(`/students/tutor/${tutorId}`, data),
  getStudent: (id) => api.get(`/students/${id}`),
  getStudentsByTutor: (tutorId) => api.get(`/students/tutor/${tutorId}`),
  addMaterial: (id, materialUrl) => api.post(`/students/${id}/materials`, { materialUrl }),
  addLessonDate: (id, lessonDate) => api.post(`/students/${id}/lessons`, { lessonDate }),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  toggleFavorite: (id, tutorId) => api.post(`/students/${id}/toggle-favorite`, { tutorId }),
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/students/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.photoUrl;
  },
  uploadMaterial: async (file, tutorId, studentId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tutorId', tutorId);
    formData.append('studentId', studentId);
    const response = await api.post('/students/upload-material', formData);
    return response.data.fileUrl;
  },
};

export default api;
