import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await axios.post(`${API_BASE_URL}/students/tutors/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/students/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.photoUrl;
  },
  uploadMaterial: async (file, tutorId, studentId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tutorId', tutorId);
    formData.append('studentId', studentId);
    // Используем axios напрямую без предустановленных заголовков
    // Браузер автоматически установит Content-Type с правильным boundary
    const response = await axios.post(`${API_BASE_URL}/students/upload-material`, formData);
    return response.data.fileUrl;
  },
};

export default api;

