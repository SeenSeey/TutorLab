import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studentApi } from '../../services/api';
import { API_BASE } from '../../config.js';
import Calendar from './Calendar';
import LessonModal from './LessonModal';
import ThemeToggle from '../ui/ThemeToggle';
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

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    try {
      const response = await studentApi.getStudent(id);
      setStudent(response.data);

      if (response.data.lessonDates) {
        const lessonsData = response.data.lessonDates.map(dateStr => {
          if (dateStr.includes('|')) {
            const [date, time, note] = dateStr.split('|');
            return { date, time, note: note || '' };
          }
          return { date: dateStr, time: '', note: '' };
        });
        setLessons(lessonsData);
      } else {
        setLessons([]);
      }
    } catch {
      toast.error('Не удалось загрузить информацию об ученике');
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 10MB');
      return;
    }
    setNewMaterialFile(file);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialFile || !tutorId) return;

    setMaterialUploading(true);
    try {
      const fileUrl = await studentApi.uploadMaterial(newMaterialFile, tutorId, id);
      await studentApi.addMaterial(id, fileUrl);
      setNewMaterialFile(null);
      const fileInput = document.getElementById('materialFile');
      if (fileInput) fileInput.value = '';
      loadStudent();
    } catch {
      toast.error('Не удалось загрузить материал');
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
      const lessonString = `${lessonData.date}|${lessonData.time}|${lessonData.note || ''}`;
      await studentApi.addLessonDate(id, lessonString);

      const existingIndex = lessons.findIndex(l => l.date === lessonData.date);
      if (existingIndex >= 0) {
        const updated = [...lessons];
        updated[existingIndex] = lessonData;
        setLessons(updated);
      } else {
        setLessons([...lessons, lessonData]);
      }

      setShowLessonModal(false);
      setSelectedDate(null);
      setSelectedLesson(null);
      await loadStudent();
    } catch {
      toast.error('Не удалось сохранить урок');
    }
  };

  const getPhotoUrl = () => {
    if (!student?.photoUrl) return null;
    if (student.photoUrl.startsWith('/api/')) return `${API_BASE}${student.photoUrl}`;
    return student.photoUrl;
  };

  if (loading) {
    return (
      <div className="student-detail-container">
        <header className="detail-nav" role="banner">
          <div className="detail-nav-inner">
            <button className="detail-nav-brand" onClick={() => navigate('/home')} aria-label="На главную">
              <div className="brand-logo-mark">TL</div>
              <span className="brand-name">TutorLab</span>
            </button>
          </div>
        </header>
        <div className="container">
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-detail-container">
        <header className="detail-nav" role="banner">
          <div className="detail-nav-inner">
            <button className="detail-nav-brand" onClick={() => navigate('/home')} aria-label="На главную">
              <div className="brand-logo-mark">TL</div>
              <span className="brand-name">TutorLab</span>
            </button>
          </div>
        </header>
        <div className="container">
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Ученик не найден
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/home')}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const photoUrl = getPhotoUrl();
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <div className="student-detail-container">

      {/* Top navigation */}
      <header className="detail-nav" role="banner">
        <div className="detail-nav-inner">
          <button className="detail-nav-brand" onClick={() => navigate('/home')} aria-label="На главную">
            <div className="brand-logo-mark">TL</div>
            <span className="brand-name">TutorLab</span>
          </button>

          <nav className="detail-nav-breadcrumb" aria-label="Навигация">
            <button className="detail-nav-parent" onClick={() => navigate('/home')}>
              Ученики
            </button>
            <span className="detail-nav-sep">›</span>
            <span className="detail-nav-current">{fullName}</span>
          </nav>

          <div className="detail-nav-actions">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container">

        {/* Student main card */}
        <div className="student-main-card card">
          <div className="student-main-content">
            <div className="student-photo-section">
              {photoUrl ? (
                <img src={photoUrl} alt={fullName} className="student-photo" />
              ) : (
                <div className="student-photo-placeholder">
                  <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="student-info-section">
              <h1>{fullName}</h1>
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

        {/* Calendar */}
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
              <h3 style={{ marginTop: '30px', marginBottom: '16px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
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
                    const diff = new Date(a.date) - new Date(b.date);
                    if (diff !== 0) return diff;
                    return (a.time || '').localeCompare(b.time || '');
                  })
                  .map((lesson, index) => {
                    const lessonDate = new Date(lesson.date);
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    let dateLabel = lessonDate.toLocaleDateString('ru-RU', {
                      day: 'numeric', month: 'long', weekday: 'long',
                    });
                    if (lessonDate.toDateString() === today.toDateString()) dateLabel = 'Сегодня';
                    else if (lessonDate.toDateString() === tomorrow.toDateString()) dateLabel = 'Завтра';

                    return (
                      <div key={index} className="lesson-item">
                        <div className="lesson-item-main" onClick={() => handleDateClick(lesson.date, lesson)}>
                          <div className="lesson-item-date">
                            <span className="lesson-date-label">{dateLabel}</span>
                            {lesson.time && <span className="lesson-time-label">{lesson.time}</span>}
                          </div>
                          {lesson.note && <div className="lesson-item-note">{lesson.note}</div>}
                        </div>
                        {lessonDate.toDateString() === today.toDateString() && (
                          <button
                            className="btn btn-primary lesson-start-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/live/teacher?studentId=${id}&studentName=${encodeURIComponent(fullName)}`);
                            }}
                          >
                            Начать урок
                          </button>
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
          />
        )}

        {/* Materials */}
        <div className="card">
          <h2>Материалы</h2>
          {student.materialUrls && student.materialUrls.length > 0 ? (
            <ul className="materials-list">
              {student.materialUrls.map((url, index) => {
                const displayUrl = url.startsWith('/api/') ? `${API_BASE}${url}` : url;
                const fileName = decodeURIComponent(url.split('/').pop() || `Материал ${index + 1}`);
                return (
                  <li key={index}>
                    <a href={displayUrl} target="_blank" rel="noopener noreferrer" download>
                      📄 {fileName}
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
            <label htmlFor="materialFile" className="file-upload-label">
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
