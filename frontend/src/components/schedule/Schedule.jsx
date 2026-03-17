import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';
import { API_BASE } from '../../config.js';
import ThemeToggle from '../ui/ThemeToggle';
import './Schedule.css';

function Schedule({ tutorId }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'past' | 'all'

  useEffect(() => {
    studentApi.getStudentsByTutor(tutorId)
      .then(r => setStudents(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tutorId]);

  // Flatten all lessons from all students into one list
  const allLessons = useMemo(() => {
    const lessons = [];
    students.forEach(student => {
      (student.lessonDates || []).forEach(dateStr => {
        let date = dateStr, time = '', note = '';
        if (dateStr.includes('|')) {
          [date, time, note] = dateStr.split('|');
        }
        lessons.push({
          date,
          time: time || '',
          note: note || '',
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          photoUrl: student.photoUrl,
        });
      });
    });
    return lessons.sort((a, b) => {
      const d = new Date(a.date) - new Date(b.date);
      if (d !== 0) return d;
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [students]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    if (filter === 'upcoming') return allLessons.filter(l => new Date(l.date) >= today);
    if (filter === 'past') return allLessons.filter(l => new Date(l.date) < today);
    return allLessons;
  }, [allLessons, filter]);

  // Group by month
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(lesson => {
      const d = new Date(lesson.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { label: d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }), lessons: [] };
      groups[key].lessons.push(lesson);
    });
    return Object.values(groups);
  }, [filtered]);

  const getPhotoUrl = (photoUrl) => {
    if (!photoUrl) return null;
    return photoUrl.startsWith('/api/') ? `${API_BASE}${photoUrl}` : photoUrl;
  };

  const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();
  const isTomorrow = (dateStr) => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return new Date(dateStr).toDateString() === t.toDateString();
  };

  const formatDay = (dateStr) => {
    if (isToday(dateStr)) return 'Сегодня';
    if (isTomorrow(dateStr)) return 'Завтра';
    return new Date(dateStr).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  return (
    <div className="schedule-container">
      <header className="schedule-nav" role="banner">
        <div className="schedule-nav-inner">
          <button className="schedule-nav-brand" onClick={() => navigate('/home')} aria-label="На главную">
            <div className="brand-logo-mark">TL</div>
            <span className="brand-name">TutorLab</span>
          </button>
          <nav className="schedule-nav-breadcrumb">
            <button className="schedule-nav-parent" onClick={() => navigate('/home')}>Ученики</button>
            <span className="schedule-nav-sep">›</span>
            <span className="schedule-nav-current">Расписание</span>
          </nav>
          <div className="schedule-nav-actions">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="schedule-content">
        <div className="schedule-header-row">
          <div>
            <h1 className="page-title">Расписание</h1>
            <p className="schedule-subtitle">
              {allLessons.length} {allLessons.length === 1 ? 'урок' : allLessons.length < 5 ? 'урока' : 'уроков'} •{' '}
              {students.length} {students.length === 1 ? 'ученик' : students.length < 5 ? 'ученика' : 'учеников'}
            </p>
          </div>
          <div className="schedule-filter-tabs" role="tablist">
            {[['upcoming', 'Предстоящие'], ['past', 'Прошедшие'], ['all', 'Все']].map(([val, label]) => (
              <button
                key={val}
                role="tab"
                aria-selected={filter === val}
                className={`schedule-tab ${filter === val ? 'active' : ''}`}
                onClick={() => setFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="schedule-empty">Загрузка...</div>
        ) : grouped.length === 0 ? (
          <div className="schedule-empty">
            {filter === 'upcoming' ? 'Нет предстоящих занятий' : 'Нет занятий'}
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label} className="schedule-month-group">
              <h2 className="schedule-month-title">{group.label}</h2>
              <div className="schedule-lessons">
                {group.lessons.map((lesson, i) => {
                  const photo = getPhotoUrl(lesson.photoUrl);
                  return (
                    <div
                      key={i}
                      className={`schedule-lesson-row ${isToday(lesson.date) ? 'today' : ''}`}
                      onClick={() => navigate(`/student/${lesson.studentId}`)}
                    >
                      <div className="schedule-lesson-date">
                        <span className="schedule-day">{formatDay(lesson.date)}</span>
                        {lesson.time && <span className="schedule-time">{lesson.time}</span>}
                      </div>
                      <div className="schedule-lesson-student">
                        {photo ? (
                          <img src={photo} alt={lesson.studentName} className="schedule-avatar" />
                        ) : (
                          <div className="schedule-avatar-placeholder">
                            {lesson.studentName.charAt(0)}
                          </div>
                        )}
                        <div className="schedule-lesson-info">
                          <span className="schedule-student-name">{lesson.studentName}</span>
                          {lesson.note && <span className="schedule-lesson-note">{lesson.note}</span>}
                        </div>
                      </div>
                      {isToday(lesson.date) && (
                        <button
                          className="btn btn-primary schedule-start-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/live/teacher?studentId=${lesson.studentId}&studentName=${encodeURIComponent(lesson.studentName)}`);
                          }}
                        >
                          Начать
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Schedule;
