import React from 'react';
import './StudentCard.css';

function StudentCard({ student, onClick }) {
  return (
    <div className="student-card" onClick={onClick}>
      {student.photoUrl ? (
        <img src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
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

