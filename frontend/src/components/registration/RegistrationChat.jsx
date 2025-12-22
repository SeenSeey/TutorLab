import React, { useState, useEffect, useRef } from 'react';
import { tutorApi } from '../../services/api';
import './RegistrationChat.css';

function RegistrationChat({ onRegister }) {
  const [mode, setMode] = useState(null); // 'register' или 'login'
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    login: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const registrationSteps = [
    { question: 'Отлично! Давайте начнём регистрацию. Как вас зовут?', field: 'fullName', label: 'ФИО', isPassword: false },
    { question: 'Отлично! Теперь придумайте логин:', field: 'login', label: 'Логин', isPassword: false },
    { question: 'И последнее - придумайте надёжный пароль:', field: 'password', label: 'Пароль', isPassword: true },
    { question: 'Пожалуйста, подтвердите пароль:', field: 'confirmPassword', label: 'Подтверждение пароля', isPassword: true },
  ];

  const loginSteps = [
    { question: 'Отлично! Введите ваш логин:', field: 'login', label: 'Логин', isPassword: false },
    { question: 'Теперь введите пароль:', field: 'password', label: 'Пароль', isPassword: true },
  ];

  const steps = mode === 'register' ? registrationSteps : mode === 'login' ? loginSteps : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addSystemMessage = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { type: 'system', text, timestamp: Date.now() }]);
      setIsTyping(false);
    }, 1000);
  };

  useEffect(() => {
    // Добавляем первое сообщение системы с выбором режима
    const timer = setTimeout(() => {
      addSystemMessage('Привет! Начнём регистрацию или вы уже с нами?');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (currentStep < steps.length && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [messages, currentStep, steps.length]);

  const addUserMessage = (text, isPasswordField = false) => {
    // Если это поле пароля, скрываем его звёздочками
    const displayText = isPasswordField ? '*'.repeat(text.length) : text;
    setMessages((prev) => [...prev, { type: 'user', text: displayText, timestamp: Date.now() }]);
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setCurrentStep(0);
    setFormData({
      fullName: '',
      login: '',
      password: '',
      confirmPassword: '',
    });
    
    // Добавляем сообщение о выборе
    const modeText = selectedMode === 'register' ? 'Зарегистрироваться' : 'Войти';
    addUserMessage(modeText);
    
    // Добавляем первый вопрос выбранного режима
    setTimeout(() => {
      const firstQuestion = selectedMode === 'register' 
        ? registrationSteps[0].question 
        : loginSteps[0].question;
      addSystemMessage(firstQuestion);
    }, 800);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [steps[currentStep].field]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Если режим не выбран, не обрабатываем отправку
    if (!mode) return;
    
    const currentField = steps[currentStep].field;
    const value = formData[currentField].trim();
    
    if (!value) {
      setError('Пожалуйста, заполните это поле');
      return;
    }

    // Проверка подтверждения пароля (только для регистрации)
    if (mode === 'register' && currentField === 'confirmPassword') {
      if (value !== formData.password) {
        setError('Пароли не совпадают. Попробуйте ещё раз.');
        return;
      }
    }

    setError('');
    addUserMessage(value, steps[currentStep].isPassword);

    if (currentStep < steps.length - 1) {
      // Переход к следующему вопросу
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        addSystemMessage(steps[currentStep + 1].question);
        // Сбрасываем состояние показа пароля при переходе
        setShowPassword(false);
        setShowConfirmPassword(false);
      }, 800);
    } else {
      // Все данные собраны
      setLoading(true);
      try {
        if (mode === 'register') {
          // Регистрация
          const response = await tutorApi.register({
            fullName: formData.fullName,
            login: formData.login,
            password: formData.password,
          });
          addSystemMessage('Отлично! Регистрация завершена. Добро пожаловать! 🎉');
          setTimeout(() => {
            onRegister(response.data.id);
          }, 1500);
        } else {
          // Вход
          const response = await tutorApi.login({
            login: formData.login,
            password: formData.password,
          });
          addSystemMessage('Отлично! Вход выполнен. Добро пожаловать! 🎉');
          setTimeout(() => {
            onRegister(response.data.id);
          }, 1500);
        }
      } catch (err) {
        if (mode === 'login' && err.response && err.response.status === 401) {
          setError('Неверный логин или пароль');
          addSystemMessage('Неверный логин или пароль. Попробуйте ещё раз.');
        } else {
          setError(mode === 'register' ? 'Ошибка при регистрации. Попробуйте ещё раз.' : 'Ошибка при входе. Попробуйте ещё раз.');
          addSystemMessage('К сожалению, произошла ошибка. Давайте попробуем ещё раз.');
        }
        console.error(err);
        setLoading(false);
      }
    }
  };

  const currentField = steps[currentStep]?.field;
  const currentValue = formData[currentField] || '';
  const isPasswordField = steps[currentStep]?.isPassword || false;
  const shouldShowEye = isPasswordField && currentValue.length > 0;
  const isPasswordVisible = (currentField === 'password' && showPassword) || 
                           (currentField === 'confirmPassword' && showConfirmPassword);

  const togglePasswordVisibility = () => {
    if (currentField === 'password') {
      setShowPassword(!showPassword);
    } else if (currentField === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="registration-chat-overlay">
      <div className="registration-chat-container">
        <div className="registration-chat-header">
          <h1>{mode === 'login' ? 'Вход' : mode === 'register' ? 'Регистрация' : 'Добро пожаловать'}</h1>
        </div>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.type === 'system' ? 'message-system' : 'message-user'}`}
            >
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))}
          
          {/* Кнопки выбора режима (показываются только если режим не выбран) */}
          {!mode && messages.length > 0 && !isTyping && (
            <div className="message message-system">
              <div className="message-content mode-buttons">
                <button
                  type="button"
                  className="mode-btn register-btn"
                  onClick={() => handleModeSelect('register')}
                  disabled={loading}
                >
                  Зарегистрироваться
                </button>
                <button
                  type="button"
                  className="mode-btn login-btn"
                  onClick={() => handleModeSelect('login')}
                  disabled={loading}
                >
                  Войти
                </button>
              </div>
            </div>
          )}
          
          {isTyping && (
            <div className="message message-system">
              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {mode && (
          <form onSubmit={handleSubmit} className="chat-input-form">
            {error && <div className="error-message">{error}</div>}
            <div className="input-wrapper">
              <div className="input-container">
                <input
                  ref={inputRef}
                  type={isPasswordField && !isPasswordVisible ? 'password' : 'text'}
                  value={currentValue}
                  onChange={handleInputChange}
                  placeholder={`Введите ${steps[currentStep]?.label.toLowerCase()}`}
                  disabled={loading || isTyping}
                  className="chat-input"
                  autoFocus
                />
                {shouldShowEye && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle-btn"
                    tabIndex={-1}
                  >
                    {isPasswordVisible ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M1 1l22 22M23 1L1 23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || isTyping || !currentValue.trim()}
                className="chat-submit-btn"
              >
                {loading ? '⏳' : '→'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegistrationChat;

