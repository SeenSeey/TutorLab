import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import RegistrationChat from './components/registration/RegistrationChat';
import Login from './components/login/Login';
import Home from './components/home/Home';
import Settings from './components/settings/Settings';
import StudentDetail from './components/student/StudentDetail';
import LiveLessonTeacher from './components/live/LiveLessonTeacher';
import LiveLessonStudent from './components/live/LiveLessonStudent';
import './App.css';

function AppContent() {
  const [tutorId, setTutorId] = useState(localStorage.getItem('tutorId'));
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

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
    setShowLogin(false);
  };

  const handleLogin = (id) => {
    setTutorId(id);
    localStorage.setItem('tutorId', id);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setTutorId(null);
    localStorage.removeItem('tutorId');
  };

  return (
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
                    {showLogin ? (
                      <Login onLogin={handleLogin} />
                    ) : (
                      <>
                        <RegistrationChat onRegister={handleRegister} />
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                          <button 
                            onClick={() => setShowLogin(true)}
                            style={{
                              background: 'transparent',
                              border: '2px solid white',
                              color: 'white',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            Уже есть аккаунт? Войти
                          </button>
                        </div>
                      </>
                    )}
                  </>
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
      <AppContent />
    </Router>
  );
}

export default App;
