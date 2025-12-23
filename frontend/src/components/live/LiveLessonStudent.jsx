// src/components/live/LiveLessonStudent.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { connectToSession } from '../../services/wsClient';
import Peer from 'simple-peer';
import api from '../../services/api';
import './LiveLesson.css';

function LiveLessonStudent() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [presentation, setPresentation] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [audioConnected, setAudioConnected] = useState(false);
  const [pointerPos, setPointerPos] = useState(null);

  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const clientRef = useRef(null);
  const canvasRef = useRef(null);
  const pointerTimeoutRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/live/sessions/${sessionId}`);
        setSession(res.data);

        // Загрузить презентацию если есть
        try {
          const presRes = await api.get(`/live/sessions/${sessionId}/presentation`);
          setPresentation(presRes.data);
          setCurrentSlide(presRes.data.currentSlide || 0);
        } catch (err) {
          console.log('Презентация ещё не загружена');
        }

        const wsClient = connectToSession(sessionId, {
          onWebRTC: handleWebRTCSignal,
          onSlideChange: (data) => {
            setCurrentSlide(data.slideIndex);
          },
          onPresentationUpdate: (data) => {
            console.log('📊 Презентация получена:', data);
            setPresentation({ slides: data.slides });
            setCurrentSlide(0);
          },
          onDraw: (data) => {
            drawOnCanvas(data);
          },
          onPointer: (data) => {
            setPointerPos({ x: data.x, y: data.y });

            // Скрыть указатель через 2 секунды
            if (pointerTimeoutRef.current) {
              clearTimeout(pointerTimeoutRef.current);
            }
            pointerTimeoutRef.current = setTimeout(() => {
              setPointerPos(null);
            }, 2000);
          },
          onClear: () => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          },
        });
        clientRef.current = wsClient;
      } catch (err) {
        console.error('Ошибка загрузки сессии:', err);
      }
    };

    load();

    return () => {
      if (clientRef.current) clientRef.current.disconnect();
      if (peerRef.current) peerRef.current.destroy();
      if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
    };
  }, [sessionId]);

  // ✅ ЗАГРУЗКА РИСУНКОВ ПРИ СМЕНЕ СЛАЙДА
  useEffect(() => {
    if (canvasRef.current && sessionId) {
      loadSlideDrawings(currentSlide);
    }
  }, [currentSlide, sessionId]);

  // ✅ ФУНКЦИЯ ЗАГРУЗКИ РИСУНКОВ
  const loadSlideDrawings = async (slideIndex) => {
    if (!sessionId || !canvasRef.current) return;

    try {
      const res = await api.get(`/live/sessions/${sessionId}/slides/${slideIndex}/drawings`);
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
    if (data.type === 'signal') {
      if (!peerRef.current && clientRef.current) {
        peerRef.current = new Peer({
          initiator: false,
          trickle: false,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        peerRef.current.on('signal', (signal) => {
          clientRef.current.sendWebRTC({ type: 'signal', signal });
        });

        peerRef.current.on('stream', (remoteStream) => {
          if (!remoteAudioRef.current) {
            remoteAudioRef.current = new Audio();
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().then(() => {
              setAudioConnected(true);
              console.log('✅ Аудио подключено');
            }).catch(err => {
              console.error('❌ Ошибка воспроизведения аудио:', err);
            });
          }
        });

        peerRef.current.on('error', (err) => {
          console.error('❌ WebRTC error:', err);
        });
      }

      if (peerRef.current) {
        peerRef.current.signal(data.signal);
      }
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

  return (
    <div className="live-lesson-container">
      <div className="live-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h2>🎥 Живой урок (ученик)</h2>
          {audioConnected && (
            <span style={{
              color: '#4CAF50',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '8px 16px',
              background: 'rgba(76, 175, 80, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              🔊 Аудио подключено
            </span>
          )}
        </div>
      </div>

      {presentation ? (
        <div className="canvas-container" style={{ position: 'relative' }}>
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
          />

          {/* Указатель преподавателя */}
          {pointerPos && (
            <div
              style={{
                position: 'absolute',
                left: `${pointerPos.x}px`,
                top: `${pointerPos.y}px`,
                fontSize: '48px',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 1000,
                transition: 'left 0.1s, top 0.1s',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
              }}
            >
              👆
            </div>
          )}

          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            zIndex: 100
          }}>
            {currentSlide + 1} / {presentation.slides.length}
          </div>
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
            ⏳ Ожидание презентации от преподавателя...
          </p>
        </div>
      )}
    </div>
  );
}

export default LiveLessonStudent;
