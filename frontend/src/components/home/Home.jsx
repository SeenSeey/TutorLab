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

  const handleStartLesson = () => {
    navigate('/live/teacher');
  };

  return (
    <div className="home-container">
      <div className="container">
        <div className="home-header">
          <h1>Мои ученики</h1>
          {tutorId && tutorId !== 'temp' && (
            <div className="header-actions">
              <button
                className="btn btn-success"
                onClick={handleStartLesson}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  marginRight: '12px'
                }}
              >
                🎥 Начать урок
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                + Добавить ученика
              </button>
            </div>
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
