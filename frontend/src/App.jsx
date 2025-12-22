import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationChat from './components/registration/RegistrationChat';
import Home from './components/home/Home';
import StudentDetail from './components/student/StudentDetail';
import LiveLessonTeacher from './components/live/LiveLessonTeacher';
import LiveLessonStudent from './components/live/LiveLessonStudent';
import './App.css';

function App() {
  const [tutorId, setTutorId] = useState(localStorage.getItem('tutorId'));

  useEffect(() => {
    if (tutorId) {
      localStorage.setItem('tutorId', tutorId);
    } else {
      localStorage.removeItem('tutorId');
    }
  }, [tutorId]);

  const handleRegister = (id) => {
    setTutorId(id);
    localStorage.setItem('tutorId', id);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/home"
            element={
              <>
                {tutorId ? (
                  <Home tutorId={tutorId} />
                ) : (
                  <>
                    <div className="home-background">
                      <Home tutorId="temp" />
                    </div>
                    <RegistrationChat onRegister={handleRegister} />
                  </>
                )}
              </>
            }
          />
          <Route
            path="/student/:id"
            element={
              tutorId ? <StudentDetail tutorId={tutorId} /> : <Navigate to="/home" replace />
            }
          />
          <Route
            path="/live/teacher"
            element={
              tutorId ? <LiveLessonTeacher tutorId={tutorId} /> : <Navigate to="/home" replace />
            }
          />
          <Route
            path="/live/student/:sessionId"
            element={<LiveLessonStudent />}
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
