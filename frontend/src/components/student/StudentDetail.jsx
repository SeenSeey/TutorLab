import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';
import './StudentDetail.css';

function StudentDetail({ tutorId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [newLessonDate, setNewLessonDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    try {
      const response = await studentApi.getStudent(id);
      setStudent(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке ученика:', err);
      setError('Не удалось загрузить информацию об ученике');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialUrl.trim()) return;

    try {
      await studentApi.addMaterial(id, newMaterialUrl);
      setNewMaterialUrl('');
      loadStudent();
    } catch (err) {
      console.error('Ошибка при добавлении материала:', err);
    }
  };

  const handleAddLessonDate = async (e) => {
    e.preventDefault();
    if (!newLessonDate.trim()) return;

    try {
      await studentApi.addLessonDate(id, newLessonDate);
      setNewLessonDate('');
      loadStudent();
    } catch (err) {
      console.error('Ошибка при добавлении даты занятия:', err);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error || !student) {
    return (
      <div className="container">
        <div className="error-message">{error || 'Ученик не найден'}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/home')}>
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="student-detail-container">
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/home')}>
          ← Назад
        </button>

        <div className="student-detail-header">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="student-photo" />
          ) : (
            <div className="student-photo-placeholder">
              <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
            </div>
          )}
          <div className="student-info">
            <h1>{student.firstName} {student.lastName}</h1>
            <p className="student-age">Возраст: {student.age} лет</p>
          </div>
        </div>

        <div className="card">
          <h2>Интересы</h2>
          {student.interests && student.interests.length > 0 ? (
            <div className="interests-list">
              {student.interests.map((interest, index) => (
                <span key={index} className="interest-tag">{interest}</span>
              ))}
            </div>
          ) : (
            <p className="empty-text">Интересы не указаны</p>
          )}
        </div>

        <div className="card">
          <h2>Календарь занятий</h2>
          {student.lessonDates && student.lessonDates.length > 0 ? (
            <div className="calendar">
              {student.lessonDates.map((date, index) => (
                <span key={index} className="calendar-date">{date}</span>
              ))}
            </div>
          ) : (
            <p className="empty-text">Даты занятий не добавлены</p>
          )}
          <form onSubmit={handleAddLessonDate} className="add-form">
            <input
              type="date"
              value={newLessonDate}
              onChange={(e) => setNewLessonDate(e.target.value)}
              className="form-input"
              required
            />
            <button type="submit" className="btn btn-primary">Добавить дату</button>
          </form>
        </div>

        <div className="card">
          <h2>Материалы</h2>
          {student.materialUrls && student.materialUrls.length > 0 ? (
            <ul className="materials-list">
              {student.materialUrls.map((url, index) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">Материалы не добавлены</p>
          )}
          <form onSubmit={handleAddMaterial} className="add-form">
            <input
              type="url"
              value={newMaterialUrl}
              onChange={(e) => setNewMaterialUrl(e.target.value)}
              placeholder="https://example.com/material.pdf"
              className="form-input"
              required
            />
            <button type="submit" className="btn btn-primary">Добавить материал</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentDetail;

