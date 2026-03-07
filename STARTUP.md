# 🚀 Quick Startup Guide

## Simplest Way (Docker - Recommended)

Just run this single command from the project root:

```bash
docker-compose up
```

That's it! Docker will:
- ✅ Build both backend and frontend
- ✅ Load your .env files automatically
- ✅ Start both services
- ✅ Set up networking between them

### First Time Setup:
```bash
# Build the containers (first time only)
docker-compose build

# Start everything
docker-compose up
```

### Subsequent Runs:
```bash
# Just start (much faster)
docker-compose up
```

### Stop Everything:
```bash
# Press Ctrl+C in the terminal, then:
docker-compose down
```

### Rebuild After Code Changes:
```bash
docker-compose up --build
```

---

## Alternative: Manual Start (Without Docker)

### Backend (Terminal 1):
```bash
cd backend
.venv\Scripts\activate
python orchestrator/api.py
```

### Frontend (Terminal 2):
```bash
cd frontend
npm run dev
```

---

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Troubleshooting

### Docker Issues:
```bash
# Clean everything and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Port Already in Use:
```bash
# Check what's using the port
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Kill the process or change ports in docker-compose.yml
```

### Environment Variables Not Loading:
- Make sure `backend/.env` and `frontend/.env` exist
- Check that `.env` files are in the correct directories
- Rebuild containers: `docker-compose up --build`

---

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start everything |
| `docker-compose up -d` | Start in background (detached) |
| `docker-compose down` | Stop everything |
| `docker-compose logs` | View logs |
| `docker-compose logs -f backend` | Follow backend logs |
| `docker-compose restart` | Restart all services |
| `docker-compose build` | Rebuild containers |

---

## Your Setup is Ready! 🎉

Your `.env` files are already configured with your API keys.
Just run `docker-compose up` and you're good to go!
