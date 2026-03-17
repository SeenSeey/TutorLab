# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TutorLab is a full-stack web app for tutors to manage students and run live online lessons. It has a **Spring Boot backend** and a **React frontend**.

## Commands

### Running the project (all three required)

```bash
# 1. Start Redis
docker-compose up -d

# 2. Start backend (from project root)
./mvnw spring-boot:run

# 3. Start frontend
cd frontend && npm install && npm run dev
```

### Backend
```bash
./mvnw test                          # Run all tests
./mvnw test -Dtest=ClassName         # Run a single test class
./mvnw package -DskipTests           # Build JAR
```

### Frontend
```bash
cd frontend
npm run dev      # Dev server on http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

> Note: Frontend npm scripts use `./run-with-nvm.sh` wrapper — if running on Windows without nvm, call `vite` directly via `npx vite`.

## Architecture

### Backend (`src/main/java/project/TutorLab/`)

Layered Spring Boot app. Data is stored **only in Redis** (no relational DB) with a 30-day TTL.

- **`config/`** — `RedisConfig` (Jackson JSON serialization with type info), `WebSocketConfig` (STOMP over SockJS at `/ws`), `CorsConfig`
- **`model/`** — `Tutor`, `Student`, `live/LiveSessionState` (holds slide URLs, current slide index, per-slide `DrawPath` lists)
- **`repository/`** — Redis repositories using `RedisTemplate<String, Object>`
- **`service/`** + **`service/impl/`** — Business logic; `PdfService` converts uploaded PDFs to PNG slides via Apache PDFBox
- **`controller/`**:
  - `TutorController` — CRUD + login/register at `/api/tutors/`
  - `StudentController` — CRUD, materials, lesson dates at `/api/students/`
  - `LiveSessionController` — REST for session lifecycle, PDF upload, slide navigation at `/api/live/`
  - `LiveSessionWsController` — WebSocket message handlers (`@MessageMapping`) for draw, slide change, pointer, clear, WebRTC signals
  - `FileUploadController` — file upload at `/api/upload`; photos → `users-photos/`, materials → `materials/`

### WebSocket message flow

Frontend connects via SockJS → STOMP. Teacher sends to `/app/session/{id}/{action}`, backend broadcasts to `/topic/session.{id}.{action}`. Topics: `slide`, `draw`, `pointer`, `clear`, `presentation`, `webrtc`.

### Frontend (`frontend/src/`)

- **`App.jsx`** — React Router setup. Auth state (`tutorId`) lives in `localStorage` and is passed as props. Routes: `/home`, `/settings`, `/student/:id`, `/live/teacher`, `/live/student/:sessionId`
- **`services/api.js`** — Axios HTTP client pointing to `http://localhost:8080/api`
- **`services/wsClient.js`** — STOMP/SockJS WebSocket client; exports `connectToSession()` returning send helpers and `disconnect()`
- **`services/webrtcService.js`** — WebRTC audio via `simple-peer`; signaling over WebSocket
- **`components/live/`** — `LiveLessonTeacher.jsx` (drawing canvas, PDF upload, slide nav, mic control) and `LiveLessonStudent.jsx` (read-only view, audio receive)
- Other components mirror the routes: `home/`, `student/`, `registration/`, `login/`, `settings/`

### Key data relationships

- Tutor ID (UUID) is the primary key stored in `localStorage` after login
- Students are keyed by ID and linked to a tutor ID
- Live sessions are keyed by session ID and reference the tutor ID
- No authentication middleware — tutor ID from localStorage is passed as a request parameter

## Configuration

Backend `application.properties`:
```
spring.data.redis.host=localhost
spring.data.redis.port=6379
server.port=8080
spring.servlet.multipart.max-file-size=10MB
app.upload.dir=users-photos
app.upload.materials.dir=materials
```

Frontend API base: `http://localhost:8080/api` | WebSocket: `http://localhost:8080/ws`