
Веб-приложение для помощи репетиторам в организации учебного процесса.

## Технологический стек

- **Backend**: Java Spring Boot
- **Frontend**: React
- **База данных**: Redis

## Структура проекта

### Backend (Java Spring)

```
src/main/java/project/TutorLab/
├── config/          # Конфигурации (Redis)
├── controller/      # REST контроллеры
├── dto/             # Data Transfer Objects
├── model/           # Модели данных (Tutor, Student)
├── repository/      # Репозитории для работы с Redis
└── service/         # Бизнес-логика
```

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── components/
│   │   ├── registration/  # Компоненты регистрации
│   │   ├── home/          # Компоненты главной страницы
│   │   └── student/       # Компоненты страницы ученика
│   ├── services/         # API сервисы
│   ├── App.jsx           # Главный компонент
│   └── main.jsx          # Точка входа
├── index.html            # HTML шаблон
└── vite.config.js        # Конфигурация Vite
```

## Требования

- Java 21
- Maven
- Node.js и npm
- Docker и Docker Compose (для запуска Redis)

## Запуск проекта

### 1. Запуск Redis через Docker Compose

Самый простой способ запустить Redis:

```bash
docker-compose up -d
```

Redis будет доступен на `localhost:6379` и будет автоматически перезапускаться при перезагрузке системы.

**Проверка работы Redis:**

```bash
# Проверить статус контейнера
docker-compose ps

# Проверить логи Redis
docker-compose logs redis

# Если Redis не запущен, запустите его
docker-compose up -d redis
```

Для остановки Redis:

```bash
docker-compose down
```

Для остановки с удалением данных:

```bash
docker-compose down -v
```

**Альтернативно:** Если у вас установлен Redis локально, можно запустить его напрямую:

```bash
redis-server
```

**Важно:** Убедитесь, что Redis запущен и доступен на `localhost:6379` перед запуском backend приложения. Если Redis не запущен, приложение выдаст ошибку подключения.

### 2. Запуск Backend

```bash
# Из корневой директории проекта
./mvnw spring-boot:run
```

Backend будет доступен на `http://localhost:8080`

### 3. Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

**Примечание:** Frontend использует Vite в качестве сборщика. Для production сборки используйте:
```bash
npm run build
npm run preview
```

## API Endpoints

### Репетиторы

- `POST /api/tutors/register` - Регистрация репетитора
- `GET /api/tutors/{id}` - Получить информацию о репетиторе
- `GET /api/tutors/{id}/exists` - Проверить существование репетитора

### Ученики

- `POST /api/students/tutor/{tutorId}` - Создать нового ученика
- `GET /api/students/{id}` - Получить информацию об ученике
- `GET /api/students/tutor/{tutorId}` - Получить всех учеников репетитора
- `POST /api/students/{id}/materials` - Добавить материал к ученику
- `POST /api/students/{id}/lessons` - Добавить дату занятия

## Функциональность

### Регистрация репетитора
- Простая регистрация без JWT/Spring Security
- ID репетитора сохраняется в localStorage браузера
- Данные репетитора хранятся в Redis

### Главная страница
- Отображение карточек всех учеников репетитора
- Каждая карточка содержит: имя, фамилию, возраст, фото
- Возможность добавления нового ученика
- Переход к странице ученика по клику на карточку

### Страница ученика
- Полная информация об ученике
- Список интересов
- Календарь с датами занятий
- Список прикрепленных материалов
- Возможность добавления новых материалов и дат занятий

## Примечания

- Проект представляет собой каркас для последующей разработки
- Все данные хранятся в Redis с TTL 30 дней
- ID репетитора используется для идентификации во всех запросах
- Frontend использует React Router для навигации

