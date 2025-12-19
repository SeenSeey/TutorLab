import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Registration from './components/registration/Registration';
import Home from './components/home/Home';
import StudentDetail from './components/student/StudentDetail';
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

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/register" 
            element={
              tutorId ? <Navigate to="/home" replace /> : <Registration onRegister={setTutorId} />
            } 
          />
          <Route 
            path="/home" 
            element={
              tutorId ? <Home tutorId={tutorId} /> : <Navigate to="/register" replace />
            } 
          />
          <Route 
            path="/student/:id" 
            element={
              tutorId ? <StudentDetail tutorId={tutorId} /> : <Navigate to="/register" replace />
            } 
          />
          <Route path="/" element={<Navigate to={tutorId ? "/home" : "/register"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

