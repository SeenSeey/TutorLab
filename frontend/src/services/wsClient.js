// src/services/wsClient.js
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

let stompClient = null;
let subscriptions = {};

export const connectToSession = (sessionId, callbacks = {}) => {
  const socket = new SockJS('http://localhost:8080/ws');
  stompClient = Stomp.over(socket);

  stompClient.debug = () => {}; // Отключить логи

  stompClient.connect({}, (frame) => {
    console.log('✅ WebSocket connected to session:', sessionId);

    // 📊 ПРЕЗЕНТАЦИЯ — автообновление при загрузке PDF
    subscriptions['presentation'] = stompClient.subscribe(
      `/topic/session.${sessionId}.presentation`,
      (message) => {
        const data = JSON.parse(message.body);
        console.log('📊 Презентация обновлена:', data);
        callbacks.onPresentationUpdate?.(data); // ✅ ИСПРАВЛЕНО
      }
    );

    // 📄 СМЕНА СЛАЙДОВ
    subscriptions['slide'] = stompClient.subscribe(
      `/topic/session.${sessionId}.slide`,
      (message) => {
        const data = JSON.parse(message.body);
        console.log('📄 Слайд изменён:', data);
        callbacks.onSlideChange?.(data); // ✅ ИСПРАВЛЕНО
      }
    );

    // ✏️ РИСОВАНИЕ
    subscriptions['draw'] = stompClient.subscribe(
      `/topic/session.${sessionId}.draw`,
      (message) => {
        const data = JSON.parse(message.body);
        console.log('✏️ Получен draw event:', data);
        callbacks.onDraw?.(data);
      }
    );

    // 👆 УКАЗКА
    subscriptions['pointer'] = stompClient.subscribe(
      `/topic/session.${sessionId}.pointer`,
      (message) => {
        const data = JSON.parse(message.body);
        console.log('👆 Получен pointer:', data);
        callbacks.onPointer?.(data);
      }
    );

    // 🗑️ ОЧИСТКА ДОСКИ
    subscriptions['clear'] = stompClient.subscribe(
      `/topic/session.${sessionId}.clear`,
      (message) => {
        console.log('🗑️ Очистка canvas');
        callbacks.onClear?.();
      }
    );

    // 🎙️ WebRTC СИГНАЛЫ
    subscriptions['webrtc'] = stompClient.subscribe(
      `/topic/session.${sessionId}.webrtc`,
      (message) => {
        const data = JSON.parse(message.body);
        callbacks.onWebRTC?.(data);
      }
    );

    callbacks.onConnect?.();
  }, (error) => {
    console.error('❌ WebSocket connection error:', error);
    callbacks.onError?.(error);
  });

  return {
    sendDraw: (data) => {
      if (stompClient && stompClient.connected) {
        console.log('📤 Отправка draw:', data);
        stompClient.send(`/app/session/${sessionId}/draw`, {}, JSON.stringify(data));
      }
    },

    sendSlideChange: (slideIndex) => {
      if (stompClient && stompClient.connected) {
        console.log('📤 Отправка slide change:', slideIndex);
        stompClient.send(`/app/session/${sessionId}/slide`, {}, JSON.stringify({ slideIndex }));
      }
    },

    sendPointer: (x, y) => {
      if (stompClient && stompClient.connected) {
        stompClient.send(`/app/session/${sessionId}/pointer`, {}, JSON.stringify({ x, y }));
      }
    },

    sendClear: () => { // ✅ ИСПРАВЛЕНО (было clearSlide)
      if (stompClient && stompClient.connected) {
        console.log('📤 Отправка clear');
        stompClient.send(`/app/session/${sessionId}/clear`, {}, JSON.stringify({}));
      }
    },

    sendWebRTC: (data) => {
      if (stompClient && stompClient.connected) {
        stompClient.send(`/app/session/${sessionId}/webrtc`, {}, JSON.stringify(data));
      }
    },

    disconnect: () => {
      Object.values(subscriptions).forEach(sub => sub.unsubscribe());
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
        console.log('🔌 WebSocket disconnected');
      }
    }
  };
};
