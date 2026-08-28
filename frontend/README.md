# Vault AI frontend

Local three-panel interface for Vault AI. Sources stay on the left, grounded Q&A runs in the centre, and studio actions sit on the right.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

The app is served at `http://localhost:5173` and proxies `/api` to FastAPI on `http://127.0.0.1:8000`.

Optional: set `VITE_API_BASE` if the backend is not reached through the Vite proxy.

## Backend contracts used

- `GET /health`
- `POST /documents/upload`
- `GET /documents`
- `DELETE /documents/{id}`
- `POST /chat`
- `POST /summary`
- `POST /entities` (fallback `/extract`)
- `POST /faq`

If the API is idle, use **Load sample workspace** to preview citations, anti-hallucination replies, and studio output without sending files off the machine.

## Build

```bash
npm run build
npm run preview
```
