# 🗄️ Render PostgreSQL Setup Guide

## Step-by-Step: Add PostgreSQL to Render

### Step 1: Go to Render Dashboard
1. Log in to [render.com](https://render.com)
2. You should see your **Web Service** (intelligent-email-assistant) that's deploying

### Step 2: Create PostgreSQL Database
1. Click the **"+"** button (top right) OR click **"New"**
2. Select **"PostgreSQL"**

   ![Screenshot: Click + then PostgreSQL](https://via.placeholder.com/400x200?text=Click+New+then+PostgreSQL)

3. Configure the database:
   - **Name**: `intelligent-email-db`
   - **Database**: `intelligent_email_prod`
   - **User**: `emailuser`
   - **Password**: Render auto-generates (⭐ **COPY THIS!**)
   - **Region**: `Oregon` (MUST match your Web Service region!)
   - **PostgreSQL Version**: `15` (or latest)
   - **Plan**: `Free`

4. Click **"Create Database"**
5. ⏳ **Wait 2-3 minutes** for database to spin up

### Step 3: Copy Database Connection String
1. After database is created, go to **PostgreSQL instance**
2. Click **"Connections"** tab
3. You'll see an **Internal Database URL** and **External Database URL**
4. Copy the **External Database URL** (looks like):
   ```
   postgresql://emailuser:YOUR_PASSWORD@oregon-postgres.render.com:5432/intelligent_email_prod
   ```

### Step 4: Add to Web Service
1. Go back to your **Web Service** (intelligent-email-assistant)
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Paste:
   - **Key**: `DATABASE_URL`
   - **Value**: (paste the connection string from Step 3)

   Example:
   ```
   postgresql://emailuser:xyzabc123@oregon-postgres.render.com:5432/intelligent_email_prod
   ```

5. Click **"Save"** ✅
6. Your Web Service will **auto-redeploy** with the database connection

### Step 5: Initialize Database (First Time Only)
After deployment, run these commands to set up the database:

**Option A: Via Render Web Shell**
1. Go to Web Service → **"Shell"** tab
2. Run:
   ```bash
   npm run db:push
   npm run db:seed
   ```

**Option B: Via Terminal (if you have Render CLI)**
```bash
render exec intelligent-email-assistant npm run db:push
render exec intelligent-email-assistant npm run db:seed
```

---

## ✅ Complete Environment Variables List

Add ALL of these to your Web Service **Environment** tab:

```
PORT=5002
NODE_ENV=production
FRONTEND_URL=https://your-service-name.onrender.com
DATABASE_URL=postgresql://emailuser:YOUR_PASSWORD@oregon-postgres.render.com:5432/intelligent_email_prod

JWT_SECRET=your-generated-64-char-random-string
TOKEN_ENCRYPTION_KEY=your-generated-64-char-random-string

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-service-name.onrender.com/api/auth/google/callback

ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=

REDIS_URL=
```

---

## 🔍 Verify Connection

After adding DATABASE_URL and redeploying:

1. Check **Logs** tab
2. Look for message:
   ```
   ✅ Successfully connected to database
   ```

3. If error, check:
   - DATABASE_URL is correct (no typos)
   - PostgreSQL instance is running (check PostgreSQL dashboard)
   - Region matches (both should be `Oregon`)
   - Wait 1-2 minutes after creating DB before connecting

---

## 📊 View Your Database

**Option 1: Render Query Editor**
1. PostgreSQL instance → **"Query"** tab
2. Run SQL directly in browser

**Option 2: External SQL Client**
1. Download [DBeaver](https://dbeaver.io) (free)
2. Create connection:
   - **Host**: `oregon-postgres.render.com`
   - **Port**: `5432`
   - **Username**: `emailuser`
   - **Password**: (the one Render generated)
   - **Database**: `intelligent_email_prod`
3. Browse tables

---

## 🚀 After Setup

Your app will:
1. ✅ Auto-deploy when you push to GitHub
2. ✅ Connect to PostgreSQL
3. ✅ Run migrations on startup
4. ✅ Be live at `https://your-service-name.onrender.com`

---

## ❓ Common Issues

### "Database connection failed"
- Wait 2-3 minutes after creating DB
- Verify `DATABASE_URL` has no typos
- Check PostgreSQL is running (dashboard shows green)

### "Permission denied for schema"
- Database needs to be initialized
- Run: `npm run db:push` from Web Shell

### "Service keeps crashing"
- Check Logs tab
- Likely missing DATABASE_URL
- Add it and save (auto-redeploy)

---

## 💾 Backup Your Data

Free tier PostgreSQL is for development only.

For production backups:
1. PostgreSQL → **"Backups"** tab
2. Download manual backup before deleting
3. Or upgrade to paid tier for automatic backups

---

**Questions? Check [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for full guide!**