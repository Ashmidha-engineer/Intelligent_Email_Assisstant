# 🚀 Deploy to Render.com (FREE)

Render.com offers a **completely free tier** - perfect for deploying your Intelligent Email Assistant!

## ✅ What You Get (Free Tier)

- **Web Service**: Auto-deploys from GitHub, auto-sleeps after 15 min inactivity
- **PostgreSQL Database**: 256MB free storage
- **HTTPS**: Automatic SSL certificate
- **No Credit Card Required** for the free tier

---

## 📋 Step-by-Step Deployment

### Step 1: Sign Up to Render
1. Go to [render.com](https://render.com)
2. Click **"Sign Up"** → Select **"GitHub"**
3. Authorize Render to access your GitHub account
4. You're in! ✅

### Step 2: Create Web Service
1. On dashboard, click **"New +"** → **"Web Service"**
2. Select your **`Intelligent_Email_Assisstant`** repository
3. Configure:
   - **Name**: `intelligent-email-assistant`
   - **Environment**: `Docker`
   - **Region**: `Oregon` (or closest to you)
   - **Branch**: `main`
   - **Dockerfile path**: `Dockerfile` (default)
   - **Plan**: `Free` ⭐

4. Click **"Create Web Service"**

### Step 3: Create PostgreSQL Database
1. On dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `intelligent-email-db`
   - **PostgreSQL Version**: `15` (or latest)
   - **Region**: `Oregon` (same as web service)
   - **Plan**: `Free` ⭐
   - **Database**: `intelligent_email_prod`
   - **User**: `emailuser`
   - **Password**: Render auto-generates (copy this!)

3. Click **"Create Database"**
4. ⏳ Wait 2-3 minutes for database to spin up
5. Copy the **connection string** (it will show as `DATABASE_URL`)

### Step 4: Configure Environment Variables
1. Go to your **Web Service** settings
2. Click **"Environment"** tab
3. Add the following variables:

```env
PORT=5002
NODE_ENV=production
FRONTEND_URL=https://your-service-name.onrender.com

# Database (paste from PostgreSQL dashboard)
DATABASE_URL=postgresql://emailuser:YOUR_PASSWORD@your-db-host:5432/intelligent_email_prod

# Security Keys - Generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=paste-your-generated-64-char-string-here
TOKEN_ENCRYPTION_KEY=paste-your-generated-64-char-string-here

# Google OAuth (Optional - leave empty for demo mode)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-service-name.onrender.com/api/auth/google/callback

# AI Providers (Optional - simulator runs by default)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=

# Redis (Optional - leave empty, app uses in-memory queue by default)
REDIS_URL=
```

4. Click **"Save"**

### Step 5: Deploy
1. Render auto-deploys on git push to `main`
2. Or manually: Web Service → **"Manual Deploy"** → **"Deploy latest commit"**
3. ⏳ Wait 5-10 minutes for build & deployment
4. Check logs: **"Logs"** tab (look for green "Your service is live")

### Step 6: Access Your App
- **Frontend**: `https://your-service-name.onrender.com`
- **API**: `https://your-service-name.onrender.com/api`
- **Health Check**: `https://your-service-name.onrender.com/api/health`

✅ **Done!** Your app is live! 🎉

---

## 🔧 First Time Setup

After deployment, run database migrations:

```bash
# Via Render Web Service shell:
# 1. Go to your service dashboard
# 2. Click "Shell" tab
# 3. Run:

npm run db:push
npm run db:seed  # Optional - adds demo emails
```

Or you can add a **start command** that runs migrations automatically.

---

## 📊 Monitor Your Deployment

### View Logs
1. Web Service → **"Logs"** tab
2. Scroll to see real-time deployment logs
3. Check for errors during startup

### View Database
1. PostgreSQL → **"Connect"** tab
2. Use connection string with a SQL client (e.g., DBeaver, pgAdmin)
3. Or use Render's built-in query editor

### Performance
1. Web Service → **"Metrics"** tab
2. View CPU, Memory, Request count
3. Identify bottlenecks

---

## ⚡ Free Tier Limitations & Solutions

| Limitation | Solution |
|-----------|----------|
| **Auto-sleeps after 15 min inactivity** | App wakes up on first request (5-10 sec delay) |
| **512MB RAM limit** | Usually enough; upgrade to paid if needed |
| **100 connections max** | Fine for personal/demo use |
| **No persistent storage** | Don't save files to disk; use database only |

---

## 💰 Upgrade to Paid (When Needed)

Free tier works great for development & testing. When you need:
- Always-on service (no auto-sleep)
- More database storage
- Higher resource limits

Just click **"Plan"** in service settings and select paid tier ($7+/month).

---

## 🔐 Production Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `TOKEN_ENCRYPTION_KEY` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password (Render auto-generates)
- [ ] Enable HTTPS only (Render auto-enables)
- [ ] Set up Google OAuth if using real Gmail
- [ ] Review environment variables (no secrets in code)
- [ ] Check logs regularly for errors

---

## 🐛 Troubleshooting

### Build Failed
1. Check **Logs** tab for error messages
2. Ensure `Dockerfile` exists in repo root
3. Verify Node version (should be 18+)
4. Run locally: `docker build -t test .`

### Database Connection Error
1. Verify `DATABASE_URL` is correct
2. Check database is running (PostgreSQL dashboard)
3. Wait 2-3 minutes if database is new
4. Test connection: `psql $DATABASE_URL`

### Port Issues
- Render automatically assigns port 5002
- Don't hardcode port; use `process.env.PORT || 5002`
- Our `server.ts` already handles this ✅

### Service Auto-Sleeping
- Expected on free tier
- First request takes 5-10 seconds
- Upgrade to paid to prevent auto-sleep

### Out of Memory
- Check **Metrics** tab
- Optimize database queries
- Reduce redis memory if using BullMQ
- Upgrade to paid plan

---

## 📞 Need Help?

- **Render Docs**: [docs.render.com](https://docs.render.com)
- **GitHub Issues**: Check repo issues
- **Local Testing**: `docker-compose up -d` to test locally first

---

## 🎯 Next Steps

1. ✅ Sign up to Render
2. ✅ Create Web Service (auto-deploys)
3. ✅ Create PostgreSQL
4. ✅ Add environment variables
5. ✅ Wait for deployment
6. ✅ Access your app!
7. ✅ Configure Google OAuth (optional)

**Your app will be live in ~10 minutes!** 🚀