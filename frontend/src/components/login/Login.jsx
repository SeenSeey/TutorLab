import React, { useState } from 'react';
import { tutorApi } from '../../services/api';
import './Login.css';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await tutorApi.login(formData);
      onLogin(response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Неверный логин или пароль');
      } else {
        setError('Ошибка при входе. Попробуйте еще раз.');
      }
      // Error handled above
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" role="main">
      <div className="login-card">
        <h1>Вход в аккаунт</h1>
        <form onSubmit={handleSubmit} noValidate aria-label="Форма входа">
          <div className="form-group">
            <label htmlFor="login-input">Логин</label>
            <input
              type="text"
              id="login-input"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
              autoComplete="username"
              aria-required="true"
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password-input">Пароль</label>
            <input
              type="password"
              id="password-input"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              aria-required="true"
            />
          </div>
          {error && (
            <div id="login-error" className="error-message" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            aria-busy={loading}
            aria-label={loading ? 'Выполняется вход...' : 'Войти в аккаунт'}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

