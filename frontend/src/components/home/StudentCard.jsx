import React, { useState, useRef, useEffect } from 'react';
import './StudentCard.css';

function StudentCard({ student, onClick, onDelete, onToggleFavorite, tutorId }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Если photoUrl начинается с /api/, добавляем базовый URL
  const getPhotoUrl = () => {
    if (!student.photoUrl) return null;
    if (student.photoUrl.startsWith('/api/')) {
      return `http://localhost:8080${student.photoUrl}`;
    }
    return student.photoUrl;
  };

  const photoUrl = getPhotoUrl();

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить этого ученика?')) {
      onDelete(student.id);
      setShowMenu(false);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite(student.id);
    setShowMenu(false);
  };

  const handleCardClick = (e) => {
    if (!menuRef.current?.contains(e.target)) {
      onClick();
    }
  };

  return (
    <div className="student-card" onClick={handleCardClick}>
      {student.isFavorite && (
        <div className="student-card-favorite-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
      )}
      <div className="student-card-menu" ref={menuRef}>
        <button 
          className="student-card-menu-button"
          onClick={handleMenuClick}
          aria-label="Меню"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
        {showMenu && (
          <div className="student-card-menu-dropdown">
            <button 
              className="student-card-menu-item"
              onClick={handleToggleFavorite}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={student.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {student.isFavorite ? 'Удалить из избранного' : 'Добавить в избранные'}
            </button>
            <button 
              className="student-card-menu-item student-card-menu-item-danger"
              onClick={handleDelete}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Удалить
            </button>
          </div>
        )}
      </div>
      {photoUrl ? (
        <img src={photoUrl} alt={`${student.firstName} ${student.lastName}`} />
      ) : (
        <div className="student-card-placeholder">
          <span>{student.firstName.charAt(0)}{student.lastName.charAt(0)}</span>
        </div>
      )}
      <h3>{student.firstName} {student.lastName}</h3>
      <p>Возраст: {student.age} лет</p>
    </div>
  );
}

export default StudentCard;

