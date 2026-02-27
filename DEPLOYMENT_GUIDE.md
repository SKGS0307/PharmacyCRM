# Pharmacy CRM - Deployment Guide

This guide provides step-by-step instructions to deploy the Pharmacy CRM application to production environments.

## Prerequisites

- GitHub account
- Vercel or Netlify account (for frontend)
- Heroku, Railway, or Render account (for backend)
- Git CLI installed locally

## Backend Deployment (Python/FastAPI)

### Option 1: Deploy to Heroku

**Step 1: Prepare Backend**

```bash
cd backend

# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Create runtime.txt
echo "python-3.13.0" > runtime.txt
```

**Step 2: Deploy to Heroku**

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create pharmacy-crm-api

# Add PostgreSQL database (optional, replaces SQLite)
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set CORS_ORIGINS="https://your-frontend-url.vercel.app"

# Deploy
git push heroku main
```

**Step 3: Verify**

```bash
# Check logs
heroku logs --tail

# Test API
curl https://pharmacy-crm-api.herokuapp.com/api/health
```

### Option 2: Deploy to Railway

**Step 1: Connect Repository**

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select `AssessmentSwasthIQ` repository

**Step 2: Configure Backend Service**

1. In Railway dashboard, click "Add Service"
2. Select "GitHub Repo"
3. Set root directory: `/backend`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Step 3: Set Environment Variables**

```
CORS_ORIGINS=https://your-frontend-url.vercel.app
DATABASE_URL=postgresql://... (if using PostgreSQL)
```

**Step 4: Deploy**

Railway auto-deploys on push to main branch.

### Option 3: Deploy to Render

**Step 1: Connect Repository**

1. Go to [render.com](https://render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub repository
5. Select `AssessmentSwasthIQ` repository

**Step 2: Configure Service**

- **Name**: `pharmacy-crm-api`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Root Directory**: `/backend`

**Step 3: Set Environment Variables**

```
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

**Step 4: Deploy**

Click "Deploy" - Render will build and deploy automatically.

---

## Frontend Deployment (React/Vite)

### Option 1: Deploy to Vercel (Recommended)

**Step 1: Connect Repository**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select GitHub repository
4. Click "Import"

**Step 2: Configure Project**

- **Framework Preset**: `Vite`
- **Root Directory**: `./frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Step 3: Set Environment Variables**

```
VITE_API_BASE_URL=https://pharmacy-crm-api.herokuapp.com/api
```

**Step 4: Deploy**

Click "Deploy" - Vercel will build and deploy automatically.

### Option 2: Deploy to Netlify

**Step 1: Connect Repository**

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site"
3. Select "Connect to Git"
4. Choose GitHub repository

**Step 2: Configure Build Settings**

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

**Step 3: Set Environment Variables**

```
VITE_API_BASE_URL=https://pharmacy-crm-api.herokuapp.com/api
```

**Step 4: Deploy**

Click "Deploy site" - Netlify will build and deploy automatically.

---

## Post-Deployment Configuration

### Update CORS Origins

Update backend CORS configuration with frontend URL:

```python
# backend/main.py
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://your-frontend-url.vercel.app").split(",")
```

### Update Frontend API URL

Update frontend API base URL:

```javascript
// frontend/src/utils/api.js
const API_BASE_URL = import.meta.env.DEV 
  ? '/api' 
  : 'https://pharmacy-crm-api.herokuapp.com/api';
```

### Database Migration (if switching from SQLite to PostgreSQL)

**Create migration script**:

```python
# backend/migrate_db.py
from sqlalchemy import create_engine, text
from models import Base

# Old SQLite database
old_engine = create_engine('sqlite:///pharmacy.sqlite3')

# New PostgreSQL database
new_engine = create_engine(os.getenv('DATABASE_URL'))

# Create tables
Base.metadata.create_all(new_engine)

# Copy data if needed
# ... migration logic ...
```

---

## Domain Configuration

### Add Custom Domain (Vercel)

1. Go to Vercel project settings
2. Select "Domains"
3. Add custom domain
4. Update DNS records as instructed

### Add Custom Domain (Netlify)

1. Go to Netlify site settings
2. Select "Domain management"
3. Add custom domain
4. Update DNS records

---

## Monitoring & Logging

### Vercel Logs

```bash
# View real-time logs
vercel logs [project-name] --tail

# View specific deployment logs
vercel logs [project-name] --prod
```

### Railway/Render Logs

Both platforms provide real-time logs in the dashboard.

### Backend Error Tracking

Consider adding error tracking with Sentry:

```python
# backend/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0
)
```

---

## Performance Optimization

### Frontend

**Enable Gzip Compression** (Vercel/Netlify):
- Automatic (no configuration needed)

**Optimize Images**:
```bash
npm install -D sharp
```

### Backend

**Enable Database Connection Pooling**:

```python
# database.py
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10
)
```

**Add Response Caching**:

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

# Configure caching
FastAPICache2.init(RedisBackend(redis_url="redis://..."), prefix="pharmacy")
```

---

## Security Checklist

- [ ] Set strong database passwords
- [ ] Configure HTTPS (automatic on Vercel/Netlify/Heroku)
- [ ] Restrict CORS origins to frontend URL only
- [ ] Add rate limiting for API endpoints
- [ ] Enable CSRF protection
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Regular security audits

---

## Rollback & Recovery

### Rollback to Previous Version

**Vercel**:
1. Go to Deployments
2. Find previous deployment
3. Click "Redeploy"

**Heroku**:
```bash
heroku releases:info
heroku rollback v123
```

**Railway/Render**:
Use dashboard to redeploy specific commit.

---

## SSL/TLS Certificate

All major platforms (Vercel, Netlify, Heroku, Railway, Render) provide free SSL certificates automatically.

---

## Database Backups

### Heroku PostgreSQL Backups

```bash
# Create backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download

# Restore backup
heroku pg:backups:restore
```

---

## Troubleshooting

### Frontend Deploy Issues

**Build fails**:
- Check `npm run build` works locally
- Verify all dependencies in `package.json`
- Check environment variables are set

**API calls fail after deploy**:
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend CORS configuration
- Verify API is responding: `curl https://api-url/api/health`

### Backend Deploy Issues

**App crashes on startup**:
- Check logs: `heroku logs --tail`
- Verify all dependencies installed: `pip install -r requirements.txt`
- Check environment variables set correctly

**Database connection fails**:
- Verify `DATABASE_URL` environment variable
- Check database credentials
- Ensure database service is running

---

## Cost Estimation

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Frontend | Free | 100GB bandwidth/month |
| Railway Backend | ~$5-10/month | Pay-as-you-go |
| PostgreSQL | Included in Railway | Included in pricing |
| **Total** | **~$5-10/month** | **Affordable** |

---

## Auto-Deployment Setup

Both Vercel and Railway support auto-deployment:

1. Connect GitHub repository
2. Select main branch
3. Every push triggers automatic deployment
4. CI/CD pipeline validates build before deploy

---

**Last Updated**: February 27, 2026  
**Version**: 1.0.0
