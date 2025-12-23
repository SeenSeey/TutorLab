// src/components/live/LiveLessonTeacher.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectToSession } from '../../services/wsClient';
import { WebRTCService } from '../../services/webrtcService';
import api from '../../services/api';
import './LiveLesson.css';

function LiveLessonTeacher({ tutorId }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [client, setClient] = useState(null);

  // Презентация
  const [presentation, setPresentation] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  // Инструменты рисования
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);

  // Аудио
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const webrtcRef = useRef(null);
  const canvasRef = useRef(null);
  const clientRef = useRef(null);
  const isDrawingRef = useRef(false);
  const pathIdRef = useRef(null);

  useEffect(() => {
    const create = async () => {
      try {
        const res = await api.post('/live/sessions', null, {
          params: { tutorId, title: 'Урок' },
        });
        setSession(res.data);

        // Попытка загрузить существующую презентацию
        try {
          const presRes = await api.get(`/live/sessions/${res.data.sessionId}/presentation`);
          setPresentation(presRes.data);
          setCurrentSlide(presRes.data.currentSlide || 0);
        } catch (err) {
          console.log('Презентация ещё не загружена');
        }

        const wsClient = connectToSession(res.data.sessionId, {
          onConnect: () => console.log('✅ WebSocket connected'),
          onWebRTC: handleWebRTCSignal,
          onSlideChange: (data) => {
            setCurrentSlide(data.slideIndex);
          },
          onPresentationUpdate: (data) => {
            console.log('📊 Презентация обновлена:', data);
            setPresentation({ slides: data.slides });
            setCurrentSlide(0);
          },
          onDraw: (data) => {
            drawOnCanvas(data);
          },
          onClear: () => {
            clearCanvas();
          },
        });
        setClient(wsClient);
        clientRef.current = wsClient;
      } catch (err) {
        console.error('Ошибка создания сессии:', err);
      }
    };

    create();

    return () => {
      if (clientRef.current) clientRef.current.disconnect();
      if (webrtcRef.current) webrtcRef.current.stopAudioStream();
    };
  }, [tutorId]);

  // ✅ ЗАГРУЗКА РИСУНКОВ ПРИ СМЕНЕ СЛАЙДА
  useEffect(() => {
    if (canvasRef.current && session) {
      loadSlideDrawings(currentSlide);
    }
  }, [currentSlide, session]);

  // ✅ ФУНКЦИЯ ЗАГРУЗКИ РИСУНКОВ
  const loadSlideDrawings = async (slideIndex) => {
    if (!session || !canvasRef.current) return;

    try {
      const res = await api.get(`/live/sessions/${session.sessionId}/slides/${slideIndex}/drawings`);
      const drawings = res.data;

      // Очистить canvas
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.currentPaths = {};

      // Отрисовать сохраненные пути
      drawings.forEach(path => {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        if (path.points && path.points.length > 0) {
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.stroke();
        }
      });

      console.log(`✅ Загружено ${drawings.length} рисунков для слайда ${slideIndex}`);
    } catch (err) {
      console.log('Нет сохраненных рисунков для этого слайда');
      // Очистить canvas если нет рисунков
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.currentPaths = {};
      }
    }
  };

  const handleWebRTCSignal = (data) => {
    if (data.type === 'signal' && webrtcRef.current) {
      webrtcRef.current.handleSignal(data.signal);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !session) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/live/sessions/${session.sessionId}/presentation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('✅ Презентация загружена:', res.data);
      setPresentation({ slides: res.data.slides });
      setCurrentSlide(0);
    } catch (err) {
      alert('❌ Ошибка загрузки презентации');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideChange = async (direction) => {
    if (!presentation) return;

    const newSlide = Math.max(0, Math.min(presentation.slides.length - 1, currentSlide + direction));

    if (clientRef.current) {
      clientRef.current.sendSlideChange(newSlide);
    }

//     setCurrentSlide(newSlide);
  };

  const handleCanvasMouseDown = (e) => {
    if (tool === 'pointer') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    pathIdRef.current = `path-${Date.now()}-${Math.random()}`;

    if (clientRef.current) {
      clientRef.current.sendDraw({
        pathId: pathIdRef.current,
        x,
        y,
        color,
        width: lineWidth,
        end: false
      });
    }

    // Локальная отрисовка
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pointer') {
      if (clientRef.current) {
        clientRef.current.sendPointer(x, y);
      }
      return;
    }

    if (!isDrawingRef.current) return;

    if (clientRef.current) {
      clientRef.current.sendDraw({
        pathId: pathIdRef.current,
        x,
        y,
        color,
        width: lineWidth,
        end: false
      });
    }

    // Локальная отрисовка
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    if (clientRef.current) {
      clientRef.current.sendDraw({
        pathId: pathIdRef.current,
        x: 0,
        y: 0,
        color,
        width: lineWidth,
        end: true
      });
    }
  };

  const drawOnCanvas = (data) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    if (data.end) {
      if (ctx.currentPaths) {
        delete ctx.currentPaths[data.pathId];
      }
      return;
    }

    if (!data.pathId) return;

    // Initialize currentPaths if needed
    if (!ctx.currentPaths) ctx.currentPaths = {};

    if (!ctx.currentPaths[data.pathId]) {
      // NEW PATH - set all properties fresh
      ctx.currentPaths[data.pathId] = true;
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();  // ✅ Critical: start new path
      ctx.moveTo(data.x, data.y);
    } else {
      // CONTINUE EXISTING PATH
      ctx.strokeStyle = data.color;  // ✅ Reapply style properties
      ctx.lineWidth = data.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.currentPaths = {};
  };

  const handleClearDrawings = () => {
    clearCanvas();
    if (clientRef.current) {
      clientRef.current.sendClear();
    }
  };

  const toggleAudio = async () => {
    if (!isAudioEnabled) {
      if (!clientRef.current) {
        alert('WebSocket не подключен');
        return;
      }

      const rtc = new WebRTCService(clientRef.current, session.sessionId, true);
      const success = await rtc.startAudioStream();

      if (success) {
        webrtcRef.current = rtc;
        setIsAudioEnabled(true);
      } else {
        alert('❌ Не удалось получить доступ к микрофону');
      }
    } else {
      if (webrtcRef.current) {
        webrtcRef.current.stopAudioStream();
        webrtcRef.current = null;
      }
      setIsAudioEnabled(false);
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (webrtcRef.current) {
      const enabled = webrtcRef.current.toggleMute();
      setIsMuted(!enabled);
    }
  };

  const handleCopyLink = () => {
    if (session) {
      const link = `${window.location.origin}/live/student/${session.sessionId}`;
      navigator.clipboard.writeText(link);
      alert('✅ Ссылка скопирована!');
    }
  };

  return (
    <div className="live-lesson-container">
      {/* Шапка */}
      <div className="live-header">
        <div className="live-header-content">
          <button
            onClick={() => navigate('/home')}
            className="back-button"
          >
            ← Назад
          </button>
          <h1 className="live-header-title">🎥 Живой урок</h1>
        </div>
        {session && (
          <div className="student-link-container">
            <p className="student-link-label">
              📋 Ссылка для учеников:
            </p>
            <div className="student-link-wrapper">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/live/student/${session.sessionId}`}
                onClick={(e) => e.target.select()}
                className="student-link-input"
              />
              <button onClick={handleCopyLink} className="copy-link-button">
                📋 Копировать
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Панель инструментов */}
      <div className="live-controls">
        {presentation && (
          <>
            <div className="slide-controls">
              <button onClick={() => handleSlideChange(-1)} disabled={currentSlide === 0}>
                ← Назад
              </button>
              <span>
                {currentSlide + 1} / {presentation.slides.length}
              </span>
              <button onClick={() => handleSlideChange(1)} disabled={currentSlide >= presentation.slides.length - 1}>
                Вперёд →
              </button>
            </div>

            <div className="tool-controls">
              <button
                className={tool === 'pen' ? 'active' : ''}
                onClick={() => setTool('pen')}
              >
                ✏️ Ручка
              </button>
              <button
                className={tool === 'pointer' ? 'active' : ''}
                onClick={() => setTool('pointer')}
              >
                👆 Указатель
              </button>

              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '50px', height: '38px', cursor: 'pointer', borderRadius: '8px' }}
              />

              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                style={{ width: '100px' }}
              />

              <button onClick={handleClearDrawings} style={{ background: '#f44336', color: 'white' }}>
                🗑️ Очистить
              </button>
            </div>
          </>
        )}

        <div className="media-controls">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="pdf-upload-label">
            {loading ? '⏳ Загрузка...' : '📤 Загрузить PDF'}
          </label>

          <button
            onClick={toggleAudio}
            className={`microphone-button ${isAudioEnabled ? 'active' : ''}`}
          >
            {isAudioEnabled ? '🎤 Микрофон вкл' : '🎤 Микрофон'}
          </button>

          {isAudioEnabled && (
            <button
              onClick={toggleMute}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: isMuted ? '#f44336' : '#2196F3',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
        </div>
      </div>

      {/* Презентация с canvas */}
      {presentation ? (
        <div className="canvas-container">
          <img
            src={`http://localhost:8080${presentation.slides[currentSlide]}`}
            alt={`Slide ${currentSlide + 1}`}
            className="slide-background"
          />
          <canvas
            ref={canvasRef}
            width={1200}
            height={675}
            className="drawing-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{ cursor: tool === 'pointer' ? 'pointer' : 'crosshair' }}
          />
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'var(--glass-bg)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          color: 'white'
        }}>
          <p style={{ fontSize: '20px', margin: 0 }}>
            📌 Загрузите презентацию, чтобы начать
          </p>
        </div>
      )}
    </div>
  );
}

export default LiveLessonTeacher;
