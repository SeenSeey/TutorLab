import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';
import Calendar from './Calendar';
import LessonModal from './LessonModal';
import './StudentDetail.css';

function StudentDetail({ tutorId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMaterialFile, setNewMaterialFile] = useState(null);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    try {
      const response = await studentApi.getStudent(id);
      setStudent(response.data);
      
      // Преобразуем lessonDates в формат для календаря
      if (response.data.lessonDates) {
        const lessonsData = response.data.lessonDates.map(dateStr => {
          // Если дата содержит время и заметку (формат: "2024-01-15|14:00|Заметка")
          if (dateStr.includes('|')) {
            const [date, time, note] = dateStr.split('|');
            return { date, time, note: note || '' };
          }
          // Старый формат - только дата
          return { date: dateStr, time: '', note: '' };
        });
        setLessons(lessonsData);
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке ученика:', err);
      setError('Не удалось загрузить информацию об ученике');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка размера файла (макс 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Размер файла не должен превышать 10MB.');
        return;
      }
      setNewMaterialFile(file);
      setError('');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialFile || !tutorId) return;

    setMaterialUploading(true);
    try {
      // Загружаем файл с tutorId и studentId
      const fileUrl = await studentApi.uploadMaterial(newMaterialFile, tutorId, id);
      
      // Добавляем материал к студенту
      await studentApi.addMaterial(id, fileUrl);
      
      setNewMaterialFile(null);
      // Сбрасываем input файла
      const fileInput = document.getElementById('materialFile');
      if (fileInput) fileInput.value = '';
      
      loadStudent();
    } catch (err) {
      console.error('Ошибка при добавлении материала:', err);
      setError('Не удалось загрузить материал');
    } finally {
      setMaterialUploading(false);
    }
  };

  const handleDateClick = (date, existingLesson) => {
    setSelectedDate(date);
    setSelectedLesson(existingLesson || null);
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      // Формируем строку для отправки: "date|time|note"
      const lessonString = `${lessonData.date}|${lessonData.time}|${lessonData.note || ''}`;
      
      // Отправляем на сервер
      await studentApi.addLessonDate(id, lessonString);
      
      // Обновляем локальное состояние
      const existingLessonIndex = lessons.findIndex(l => l.date === lessonData.date);
      
      if (existingLessonIndex >= 0) {
        // Обновляем существующий урок
        const updatedLessons = [...lessons];
        updatedLessons[existingLessonIndex] = lessonData;
        setLessons(updatedLessons);
      } else {
        // Добавляем новый урок
        setLessons([...lessons, lessonData]);
      }
      
      setShowLessonModal(false);
      setSelectedDate(null);
      setSelectedLesson(null);
      
      // Обновляем данные студента для синхронизации с сервером
      await loadStudent();
    } catch (err) {
      console.error('Ошибка при сохранении урока:', err);
      setError('Не удалось сохранить урок');
    }
  };

  const handleDeleteLesson = async (date) => {
    try {
      // Удаляем урок из локального состояния
      const updatedLessons = lessons.filter(l => l.date !== date);
      setLessons(updatedLessons);
      
      setShowLessonModal(false);
      setSelectedDate(null);
      setSelectedLesson(null);
      
      // TODO: Добавить API endpoint для удаления урока
      // Пока просто обновляем локально и перезагружаем данные
      // В реальном приложении нужно отправить обновленный список всех уроков на сервер
      await loadStudent();
    } catch (err) {
      console.error('Ошибка при удалении урока:', err);
      setError('Не удалось удалить урок');
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

  // Если photoUrl начинается с /api/, добавляем базовый URL
  const getPhotoUrl = () => {
    if (!student.photoUrl) return null;
    if (student.photoUrl.startsWith('/api/')) {
      return `http://localhost:8080${student.photoUrl}`;
    }
    return student.photoUrl;
  };

  const photoUrl = getPhotoUrl();

  return (
    <div className="student-detail-container">
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/home')}>
          ← Назад
        </button>

        {/* Основная информация о студенте */}
        <div className="student-main-card card">
          <div className="student-main-content">
            <div className="student-photo-section">
              {photoUrl ? (
                <img src={photoUrl} alt={`${student.firstName} ${student.lastName}`} className="student-photo" />
              ) : (
                <div className="student-photo-placeholder">
                  <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="student-info-section">
              <h1>{student.firstName} {student.lastName}</h1>
              <p className="student-age">Возраст: {student.age} лет</p>
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
          </div>
        </div>

        <div className="card">
          <h2>Календарь занятий</h2>
          <Calendar lessons={lessons} onDateClick={handleDateClick} />
          {lessons.length === 0 && (
            <p className="empty-text" style={{ marginTop: '20px', textAlign: 'center' }}>
              Нажмите на дату в календаре, чтобы запланировать урок
            </p>
          )}
          {lessons.length > 0 && (
            <div className="upcoming-lessons">
              <h3 style={{ 
                marginTop: '30px', 
                marginBottom: '16px', 
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Запланированные уроки
              </h3>
              <div className="lessons-list">
                {lessons
                  .filter(lesson => {
                    const lessonDate = new Date(lesson.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return lessonDate >= today;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (dateA.getTime() === dateB.getTime()) {
                      return (a.time || '').localeCompare(b.time || '');
                    }
                    return dateA - dateB;
                  })
                  .map((lesson, index) => {
                    const lessonDate = new Date(lesson.date);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    let dateLabel = lessonDate.toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long',
                      weekday: 'long'
                    });
                    
                    if (lessonDate.toDateString() === today.toDateString()) {
                      dateLabel = 'Сегодня';
                    } else if (lessonDate.toDateString() === tomorrow.toDateString()) {
                      dateLabel = 'Завтра';
                    }
                    
                    return (
                      <div 
                        key={index} 
                        className="lesson-item"
                        onClick={() => handleDateClick(lesson.date, lesson)}
                      >
                        <div className="lesson-item-date">
                          <span className="lesson-date-label">{dateLabel}</span>
                          {lesson.time && (
                            <span className="lesson-time-label">{lesson.time}</span>
                          )}
                        </div>
                        {lesson.note && (
                          <div className="lesson-item-note">{lesson.note}</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        
        {showLessonModal && (
          <LessonModal
            date={selectedDate}
            lesson={selectedLesson}
            onSave={handleSaveLesson}
            onClose={() => {
              setShowLessonModal(false);
              setSelectedDate(null);
              setSelectedLesson(null);
            }}
            onDelete={handleDeleteLesson}
          />
        )}

        <div className="card">
          <h2>Материалы</h2>
              {student.materialUrls && student.materialUrls.length > 0 ? (
            <ul className="materials-list">
              {student.materialUrls.map((url, index) => {
                const displayUrl = url.startsWith('/api/') 
                  ? `http://localhost:8080${url}` 
                  : url;
                // Извлекаем имя файла из URL (последняя часть пути)
                const fileName = url.split('/').pop() || `Материал ${index + 1}`;
                
                return (
                  <li key={index}>
                    <a href={displayUrl} target="_blank" rel="noopener noreferrer" download>
                      📄 {decodeURIComponent(fileName)}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-text">Материалы не добавлены</p>
          )}
          <form onSubmit={handleAddMaterial} className="add-form">
            <input
              type="file"
              id="materialFile"
              onChange={handleMaterialFileChange}
              style={{ display: 'none' }}
              accept="*/*"
            />
            <label
              htmlFor="materialFile"
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                color: 'var(--text-primary)',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                e.target.style.borderColor = 'var(--accent-cyan)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--glass-bg)';
                e.target.style.borderColor = 'var(--glass-border)';
              }}
            >
              {newMaterialFile ? newMaterialFile.name : 'Выбрать файл'}
            </label>
            {newMaterialFile && (
              <button type="submit" className="btn btn-primary" disabled={materialUploading}>
                {materialUploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentDetail;

