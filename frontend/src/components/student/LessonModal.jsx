import React, { useState, useEffect } from 'react';
import './LessonModal.css';

function LessonModal({ date, lesson, onSave, onClose, onDelete }) {
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (lesson) {
      setTime(lesson.time || '');
      setNote(lesson.note || '');
    } else {
      setTime('');
      setNote('');
    }
  }, [lesson]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('ru-RU', options);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!time.trim()) {
      setError('Пожалуйста, укажите время урока');
      return;
    }

    onSave({
      date,
      time: time.trim(),
      note: note.trim()
    });
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот урок?')) {
      onDelete(date);
    }
  };

  return (
    <div className="lesson-modal-overlay" onClick={onClose}>
      <div className="lesson-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="lesson-modal-header">
          <h2>Урок на {formatDate(date)}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="time">Время *</label>
            <input
              type="time"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="note">Подпись / Заметка</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-textarea"
              placeholder="Например: Повторение темы 'Производные', Домашнее задание..."
              rows="4"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="lesson-modal-actions">
            {lesson && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Удалить урок
              </button>
            )}
            <div className="action-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                {lesson ? 'Сохранить изменения' : 'Добавить урок'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LessonModal;

