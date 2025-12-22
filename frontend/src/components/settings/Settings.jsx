import React, { useState, useEffect } from 'react';
import { tutorApi } from '../../services/api';
import './Settings.css';

function Settings({ tutorId, onBack }) {
  const [tutor, setTutor] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    about: '',
    photoUrl: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTutor();
  }, [tutorId]);

  const loadTutor = async () => {
    try {
      const response = await tutorApi.getTutor(tutorId);
      const tutorData = response.data;
      setTutor(tutorData);
      setFormData({
        fullName: tutorData.fullName || '',
        about: tutorData.about || '',
        photoUrl: tutorData.photoUrl || '',
      });
      if (tutorData.photoUrl) {
        setPhotoPreview(tutorData.photoUrl);
      }
    } catch (err) {
      console.error('Ошибка при загрузке данных репетитора:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      let photoUrl = formData.photoUrl;

      // Загружаем фото, если выбрано новое
      if (photoFile) {
        const uploadResponse = await tutorApi.uploadPhoto(photoFile);
        photoUrl = uploadResponse.data.photoUrl;
      }

      // Обновляем данные репетитора
      const updateData = {
        fullName: formData.fullName,
        about: formData.about,
        photoUrl: photoUrl,
      };

      await tutorApi.updateTutor(tutorId, updateData);
      setSuccess('Настройки успешно сохранены');
      setTimeout(() => {
        loadTutor();
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Ошибка при сохранении:', err);
      setError('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-content">
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-content">
        <div className="settings-header">
          <button className="back-button" onClick={onBack}>
            ← Назад
          </button>
          <h1>Настройки</h1>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <h2>Фото профиля</h2>
            <div className="photo-upload">
              <div className="photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span>Нет фото</span>
                  </div>
                )}
              </div>
              <label className="file-input-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="file-input"
                />
                Выбрать фото
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Личная информация</h2>
            <div className="form-group">
              <label htmlFor="fullName">ФИО</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="about">О себе</label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows="6"
                placeholder="Расскажите о себе, своем опыте и специализации..."
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;

