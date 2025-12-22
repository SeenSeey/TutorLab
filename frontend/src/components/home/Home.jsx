import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';
import StudentCard from './StudentCard';
import AddStudentModal from './AddStudentModal';
import './Home.css';

function Home({ tutorId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
  }, [tutorId]);

  const loadStudents = async () => {
    if (!tutorId || tutorId === 'temp') {
      setLoading(false);
      return;
    }
    try {
      const response = await studentApi.getStudentsByTutor(tutorId);
      setStudents(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке учеников:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentAdded = () => {
    setShowAddModal(false);
    loadStudents();
  };

  const handleCardClick = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await studentApi.deleteStudent(studentId);
      loadStudents();
    } catch (err) {
      console.error('Ошибка при удалении ученика:', err);
      alert('Не удалось удалить ученика. Попробуйте снова.');
    }
  };

  const handleToggleFavorite = async (studentId) => {
    try {
      await studentApi.toggleFavorite(studentId, tutorId);
      loadStudents();
    } catch (err) {
      console.error('Ошибка при изменении избранного:', err);
      alert('Не удалось изменить статус избранного. Попробуйте снова.');
    }
  };

  return (
    <div className="home-container">
      {/* Кнопка настроек в правом верхнем углу */}
      {tutorId && tutorId !== 'temp' && (
        <button 
          className="settings-button" 
          onClick={() => navigate('/settings')}
          title="Настройки"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 17.364m12.728 0l-4.243-4.243m-4.242 0L5.636 6.636"/>
          </svg>
        </button>
      )}
      <div className="container">
        <div className="home-header">
          <h1>Мои ученики</h1>
          {tutorId && tutorId !== 'temp' && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + Добавить ученика
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <p>У вас пока нет учеников. Добавьте первого ученика!</p>
          </div>
        ) : (
          <div className="student-grid">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={() => handleCardClick(student.id)}
                onDelete={handleDeleteStudent}
                onToggleFavorite={handleToggleFavorite}
                tutorId={tutorId}
              />
            ))}
          </div>
        )}

        {showAddModal && tutorId && tutorId !== 'temp' && (
          <AddStudentModal
            tutorId={tutorId}
            onClose={() => setShowAddModal(false)}
            onStudentAdded={handleStudentAdded}
          />
        )}
      </div>
    </div>
  );
}

export default Home;

