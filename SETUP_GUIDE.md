# Pharmacy CRM - Setup & Installation Guide

## Quick Start (5 minutes)

### Prerequisites
- Python 3.13+
- Node.js 18+ & npm
- Git

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/pharmacy-crm.git
cd pharmacy-crm
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed sample data (optional)
python seed.py

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at**: `http://localhost:8000`  
**API endpoint**: `http://localhost:8000/api`

### 3. Frontend Setup (new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will be available at**: `http://localhost:5173`

### 4. Access Application

Open browser and navigate to: `http://localhost:5173`

---

## Detailed Setup Instructions

### Backend Setup (Detailed)

#### Step 1: Create Python Virtual Environment

```bash
cd backend
python -m venv venv
```

This creates an isolated Python environment to avoid conflicts with system Python packages.

#### Step 2: Activate Virtual Environment

**Linux/Mac**:
```bash
source venv/bin/activate
```

**Windows**:
```bash
venv\Scripts\activate
```

You should see `(venv)` at the beginning of your terminal prompt.

#### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs all required packages:
- FastAPI 0.133.1
- SQLAlchemy 2.0.47
- Uvicorn 0.41.0
- Pydantic 2.12.5
- Python-dotenv 1.2.1

#### Step 4: Initialize Database (Optional)

The database is automatically created when you start the server. To populate with sample data:

```bash
python seed.py
```

This creates 8 sample medicines and 5 sample sales transactions.

#### Step 5: Start Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Output should show**:
```
INFO:     Started server process [12345]
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

#### Verify Backend is Working

```bash
# In another terminal
curl http://localhost:8000/api/health

# Should respond with:
# {"status":"ok"}
```

---

### Frontend Setup (Detailed)

#### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies from `package.json`:
- React 19.2.0
- Vite 7.3.1
- Tailwind CSS 3.4.19
- Axios 1.13.5
- React Router 7.13.1
- Lucide React 0.575.0

#### Step 3: Start Development Server

```bash
npm run dev
```

**Output should show**:
```
  VITE v7.3.1  ready in 456 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

#### Step 4: Open Application

Click the link or open browser to: `http://localhost:5173`

---

## Configuration

### Backend Configuration

**Environment Variables** (optional, create `.env` file):

```bash
# database.py
DATABASE_URL=sqlite:///pharmacy.sqlite3

# main.py
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Optional for production
LOG_LEVEL=INFO
```

### Frontend Configuration

**Vite Configuration** (`vite.config.js`):

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
```

This proxies all `/api` requests to the backend during development.

---

## File Structure

### Backend Structure

```
backend/
├── main.py              # FastAPI app & all endpoints
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic validation schemas
├── database.py          # Database configuration
├── seed.py              # Sample data seeding
├── pharmacy.sqlite3     # SQLite database (auto-created)
├── requirements.txt     # Python dependencies
└── venv/                # Virtual environment (auto-created)
```

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx    # Dashboard page
│   │   └── Inventory.jsx    # Inventory page
│   ├── utils/
│   │   └── api.js           # Centralized API client
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                   # Static assets
├── index.html               # HTML template
├── package.json             # NPM dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
└── node_modules/            # Dependencies (auto-created)
```

---

## Troubleshooting

### Backend Issues

#### Issue: "Port 8000 already in use"

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn main:app --port 8001
```

#### Issue: "ModuleNotFoundError: No module named 'fastapi'"

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Issue: Database errors

```bash
# Delete old database and reseed
rm pharmacy.sqlite3
python seed.py
```

#### Issue: CORS errors in browser console

**Check**:
1. Backend is running on port 8000
2. Frontend is running on port 5173
3. CORS middleware is configured correctly in `main.py`

### Frontend Issues

#### Issue: "Cannot find module 'react'"

```bash
# Ensure npm packages are installed
npm install

# Clear npm cache if issues persist
npm cache clean --force
npm install
```

#### Issue: API requests fail (CORS error)

**Check**:
1. Backend server is running (`http://localhost:8000`)
2. Health check works: `curl http://localhost:8000/api/health`
3. Vite proxy is configured in `vite.config.js`

#### Issue: Hot reload not working

```bash
# Restart Vite development server
npm run dev
```

#### Issue: Tailwind CSS not applying

```bash
# Rebuild Tailwind CSS
npm run build

# Or restart dev server
npm run dev
```

---

## Database Management

### View Database (SQLite)

```bash
# Install sqlite3 CLI (if not installed)
brew install sqlite3  # macOS
sudo apt install sqlite3  # Linux

# Open database
sqlite3 pharmacy.sqlite3

# View tables
.tables

# View medicines
SELECT * FROM medicines;

# Exit
.quit
```

### Reset Database

```bash
# Delete database
rm pharmacy.sqlite3

# Reseed
python seed.py
```

### Backup Database

```bash
# Create backup
cp pharmacy.sqlite3 pharmacy.sqlite3.backup

# Restore from backup
cp pharmacy.sqlite3.backup pharmacy.sqlite3
```

---

## Running Tests

### Test Backend API

```bash
# Test health check
curl http://localhost:8000/api/health

# Test get medicines
curl http://localhost:8000/api/inventory/medicines

# Test get dashboard stats
curl http://localhost:8000/api/dashboard/stats

# Test create sale
curl -X POST http://localhost:8000/api/sales/create-sale \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_no": "TEST-001",
    "customer_name": "Test User",
    "items_count": 1,
    "total_amount": 10.00,
    "payment_method": "Cash",
    "items": [{"medicine_id": 1, "quantity": 1}]
  }'
```

### Manual Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Dashboard shows real data from backend
- [ ] Inventory page loads without errors
- [ ] Can search medicines
- [ ] Can add new medicine
- [ ] Can edit existing medicine
- [ ] Can delete medicine
- [ ] Can create sale
- [ ] Medicine quantity decreases after sale
- [ ] Medicine status updates correctly

---

## Development Commands

### Backend Commands

```bash
# Start server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start without auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000

# Seed sample data
python seed.py

# Check imports
python -c "import main; print('OK')"
```

### Frontend Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

---

## Production Build

### Build Frontend

```bash
cd frontend
npm run build
```

This creates optimized production build in `dist/` folder.

### Build Backend

Backend doesn't need to be built separately. Just ensure all dependencies are installed:

```bash
pip install -r requirements.txt
```

---

## Environment Setup

### Using Environment Variables

Create `.env` file in backend directory:

```bash
# .env
DATABASE_URL=sqlite:///pharmacy.sqlite3
CORS_ORIGINS=http://localhost:5173,https://example.com
LOG_LEVEL=INFO
```

Load in `main.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
```

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Python | 3.13 | 3.13+ |
| Node.js | 18 | 18+ LTS |
| npm | 9 | 10+ |
| RAM | 2GB | 4GB |
| Disk Space | 500MB | 1GB |

---

## Getting Help

### Check Logs

**Backend logs**:
- Check terminal where `uvicorn` is running
- Look for error messages and tracebacks

**Frontend logs**:
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API errors

### Common Resources

- FastAPI Docs: http://localhost:8000/docs
- API Reference: See `API_DOCUMENTATION.md`
- Architecture: See `ARCHITECTURE.md`
- Deployment: See `DEPLOYMENT_GUIDE.md`

---

**Last Updated**: February 27, 2026  
**Version**: 1.0.0
