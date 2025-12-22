import React from 'react';
import './StudentCard.css';

function StudentCard({ student, onClick }) {
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
    <div className="student-card" onClick={onClick}>
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

