import React, { useState } from 'react';
import { studentApi } from '../../services/api';
import './AddStudentModal.css';

function AddStudentModal({ tutorId, onClose, onStudentAdded }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    photoUrl: '',
    interests: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const interestsArray = formData.interests
        ? formData.interests.split(',').map(i => i.trim()).filter(i => i)
        : [];

      const studentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        photoUrl: formData.photoUrl || null,
        interests: interestsArray,
      };

      await studentApi.createStudent(tutorId, studentData);
      onStudentAdded();
    } catch (err) {
      setError('Ошибка при создании ученика. Попробуйте еще раз.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добавить ученика</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstName">Имя *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Фамилия *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="age">Возраст *</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="1"
              max="100"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="photoUrl">URL фотографии</label>
            <input
              type="url"
              id="photoUrl"
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <div className="form-group">
            <label htmlFor="interests">Интересы (через запятую)</label>
            <input
              type="text"
              id="interests"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="Математика, Физика, Программирование"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudentModal;

