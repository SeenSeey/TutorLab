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
  getTutor: (id) => api.get(`/tutors/${id}`),
  tutorExists: (id) => api.get(`/tutors/${id}/exists`),
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
};

export default api;

