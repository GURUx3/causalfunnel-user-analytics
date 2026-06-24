# User Analytics Application

A production-style full-stack analytics platform that tracks user behavior on web pages and visualizes session data through a modern dashboard.

## Project Overview

This application consists of three parts:

1. **Tracking Script** (`tracker.js`) — a standalone vanilla JS snippet embedded on any webpage
2. **Backend API** — Express + MongoDB service for event ingestion and analytics queries
3. **Dashboard** — React SPA for exploring sessions, user journeys, and click heatmaps

```
┌─────────────┐     POST /api/events      ┌─────────────┐
│  tracker.js │ ─────────────────────────► │   Express   │
│  (browser)  │                            │   + MongoDB │
└─────────────┘                            └──────┬──────┘
                                                  │
                     GET /api/sessions            │
                     GET /api/sessions/:id        │
                     GET /api/heatmap            ▼
                                           ┌─────────────┐
                                           │   React     │
                                           │  Dashboard  │
                                           └─────────────┘
```

## Folder Structure

```
├── backend/           # Express API (layered architecture)
│   └── src/
│       ├── config/    # Database connection
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/          # React + Vite dashboard
│   ├── public/tracker.js
│   └── src/
│       ├── api/
│       ├── components/
│       └── pages/
├── demo/              # Sample site to test tracking
├── docs/              # Architecture documentation
├── tracker.js         # Standalone tracking script
└── docker-compose.yml # MongoDB container
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for schema, API contracts, and data flow diagrams.

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker (for MongoDB) or a local MongoDB instance

### 1. Start MongoDB

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # if .env doesn't exist
npm install
npm run dev
```

Server runs at `http://localhost:5000`.

### 3. Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`.

### 4. Demo Site (optional)

Serve the project root with any static file server:

```bash
npx serve . -p 3000
```

Open `http://localhost:3000/demo/` and click around. Events appear in the dashboard.

## Environment Variables

### Backend (`backend/.env`)

| Variable      | Default                              | Description              |
|---------------|--------------------------------------|--------------------------|
| `PORT`        | `5000`                               | API server port          |
| `MONGODB_URI` | `mongodb://localhost:27017/user-analytics` | MongoDB connection string |
| `CORS_ORIGIN` | `http://localhost:5173`              | Allowed frontend origin  |

### Frontend (`frontend/.env` — optional)

| Variable       | Default | Description                    |
|----------------|---------|--------------------------------|
| `VITE_API_URL` | `/api`  | API base URL (proxied in dev)  |

### Tracking Script

Configure the API endpoint before loading the script:

```html
<script>
  window.USER_ANALYTICS_ENDPOINT = 'http://localhost:5000/api/events';
</script>
<script src="tracker.js"></script>
```

## API Documentation

Base URL: `http://localhost:5000/api`

### POST `/events`

Ingest a tracking event.

**Body (page view):**
```json
{
  "sessionId": "uuid",
  "eventType": "page_view",
  "pageUrl": "/home",
  "timestamp": "2026-06-24T10:00:00.000Z"
}
```

**Body (click):**
```json
{
  "sessionId": "uuid",
  "eventType": "click",
  "pageUrl": "/home",
  "timestamp": "2026-06-24T10:02:00.000Z",
  "x": 200,
  "y": 300
}
```

| Status | Description        |
|--------|--------------------|
| 201    | Event created      |
| 400    | Validation error   |

---

### GET `/sessions`

Returns all sessions with aggregated metadata.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "...",
      "eventCount": 10,
      "firstSeen": "2026-06-24T10:00:00.000Z",
      "lastSeen": "2026-06-24T10:15:00.000Z"
    }
  ],
  "meta": {
    "totalSessions": 5,
    "totalEvents": 42
  }
}
```

---

### GET `/sessions/:sessionId`

Returns the full user journey ordered by timestamp ascending.

**Response:**
```json
{
  "success": true,
  "data": [
    { "eventType": "page_view", "pageUrl": "/home", "timestamp": "..." },
    { "eventType": "click", "pageUrl": "/home", "timestamp": "...", "x": 200, "y": 300 }
  ]
}
```

| Status | Description      |
|--------|------------------|
| 404    | Session not found |

---

### GET `/heatmap?pageUrl=/home`

Returns click coordinates for a page.

**Response:**
```json
{
  "success": true,
  "data": [{ "x": 100, "y": 200 }]
}
```

---

### GET `/pages`

Returns distinct page URLs (used by heatmap dropdown).

## Design Decisions

- **Single events collection** — all event types stored together; session metadata derived via MongoDB aggregation to avoid sync issues between collections.
- **Layered backend** — Route → Controller → Service → Model separation keeps business logic testable and routes thin.
- **Derived sessions** — no separate Sessions model; `GET /sessions` uses `$group` aggregation on the events collection.
- **Scalable heatmap** — click dots rendered in a fixed 1280×720 viewport with CSS transform scaling; no external heatmap library.
- **Fail-silent tracker** — network errors in the tracking script are swallowed so analytics never break the host page.
- **Session persistence** — `sessionId` stored in `localStorage` and reused across page refreshes.

## Assumptions

- `pageUrl` is captured as `pathname + search` (relative URL path).
- Click coordinates use viewport `clientX` / `clientY`.
- Timestamps are ISO 8601 strings from the client; server validates and stores as `Date`.
- Single-tenant deployment; no authentication required for the assignment scope.
- Heatmap viewport is normalized to 1280×720 for consistent visualization regardless of actual screen size.

## Future Improvements

- Pagination for sessions list
- Date range filters and event type filters
- Session duration and bounce rate statistics
- Rate limiting and API authentication
- Batch event ingestion
- Docker Compose service for backend + frontend
- Deployment guides (Railway, Render, Vercel)
- WebSocket live event stream on dashboard
- Export session data as CSV

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, Vite, React Router, Axios, Tailwind CSS |
| Backend  | Node.js, Express, Mongoose          |
| Database | MongoDB                             |
| Tracker  | Vanilla JavaScript                  |
# causalfunnel-user-analytics
