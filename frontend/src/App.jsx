import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE } from './config.js';
import RegistrationChat from './components/registration/RegistrationChat';
import Home from './components/home/Home';
import Settings from './components/settings/Settings';
import StudentDetail from './components/student/StudentDetail';
import LiveLessonTeacher from './components/live/LiveLessonTeacher';
import LiveLessonStudent from './components/live/LiveLessonStudent';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './App.css';

function AppContent() {
  const [tutorId, setTutorId] = useState(localStorage.getItem('tutorId'));
  const navigate = useNavigate();

  const handleAuth = (data) => {
    const id = typeof data === 'string' ? data : data.id;
    const accessToken = typeof data === 'object' ? (data.sessionToken || data.accessToken) : null;
    const refreshToken = typeof data === 'object' ? data.refreshToken : null;

    setTutorId(id);
    localStorage.setItem('tutorId', id);
    if (accessToken) localStorage.setItem('sessionToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await axios.post(`${API_BASE}/api/auth/logout`, { refreshToken });
      } catch {
        // Ignore logout errors — clear local state regardless
      }
    }
    setTutorId(null);
    localStorage.removeItem('tutorId');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <div className="App">
      <Routes>
        <Route
          path="/home"
          element={
            <>
              {tutorId ? (
                <Home tutorId={tutorId} onLogout={handleLogout} />
              ) : (
                <RegistrationChat onRegister={handleAuth} />
              )}
            </>
          }
        />
        <Route
          path="/settings"
          element={
            tutorId ? (
              <Settings tutorId={tutorId} onBack={() => navigate('/home')} />
            ) : (
              <Navigate to="/home" replace />
            )
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
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
