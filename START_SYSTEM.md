# 🚀 CLIP Matching System - Startup Guide

## Quick Start (3 terminals needed)

### Terminal 1: Start CLIP Service
```bash
npm run python:clip
```
**Wait for**: `INFO: Application startup complete`

---

### Terminal 2: Start Next.js Server  
```bash
# Stop any running server first (Ctrl+C)
npm run dev
```
**Wait for**: `Ready on http://localhost:3001`

---

### Terminal 3: Monitor Logs
```bash
# Watch server logs in real-time
tail -f .next/trace
```

---

## ✅ Verify System is Working

### 1. Check CLIP Service
```bash
curl http://localhost:8000/health
```
**Expected**: `{"status":"ok"}`

### 2. Check Environment Variables
```bash
grep BULLMQ_ENABLED .env.local
```
**Expected**: `BULLMQ_ENABLED=false`

### 3. Test Matching Workflow

**Add a Found Item** (via UI or API):
```bash
curl -X POST http://localhost:3001/api/found \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Blue iPhone 14 Pro",
    "description": "Found near library with cracked screen",
    "category": "Electronics",
    "location": {"text": "Library Building A"}
  }'
```

**Add a Lost Item** (should trigger matching):
```bash
curl -X POST http://localhost:3001/api/lost \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Blue iPhone 14",
    "description": "Lost my blue iPhone with damaged screen",
    "category": "Electronics",
    "location": {"text": "Library"}
  }'
```

**Check Server Logs** - You should see:
```
[MatchQueue] BullMQ disabled - running matching directly for item [id]
[Matching] Starting matching process for item [id]
[Matching] Found X counterpart items to compare against
[Matching] Comparing with X counterpart items using CLIP
[Matching] Match found with score 87.3%: Blue iPhone ↔ Blue iPhone 14 Pro
[Email] Sending notification to user@example.com
[Email] Email sent successfully
[MatchQueue] Direct matching completed for item [id]
```

---

## 🔍 Debugging

### Issue: No Logs Appear
**Problem**: Server not restarted after changing env vars  
**Solution**: 
```bash
# Terminal 2: Stop server (Ctrl+C), then:
npm run dev
```

### Issue: CLIP Errors
**Problem**: CLIP service not running  
**Solution**:
```bash
# Terminal 1: Start CLIP service
npm run python:clip
```

### Issue: Redis Connection Errors
**Problem**: `BULLMQ_ENABLED=true` but Redis not running  
**Solution**:
```bash
# Either start Redis:
brew services start redis

# OR disable BullMQ in .env.local:
BULLMQ_ENABLED=false
# Then restart server
```

### Issue: No Matches Found
**Possible causes**:
1. Items too dissimilar (score < 75%)
2. CLIP service down
3. No counterpart items exist

**Check logs for**:
```bash
grep "\[Matching\]" logs
grep "\[CLIP\]" logs
```

---

## 📊 How It Works

```
User adds item (lost or found)
  ↓
API saves to MongoDB
  ↓
addMatchJob() called
  ↓
[If BULLMQ_ENABLED=false]
  → Runs directly via setImmediate()
  
[If BULLMQ_ENABLED=true]
  → Enqueues to Redis
  → Worker processes job
  
  ↓
Generate CLIP embedding (text + image)
  ↓
Compare with all counterpart items
  ↓
Filter matches ≥ 75% similarity
  ↓
Send email notifications
  ↓
Log to prevent duplicates
```

---

## 🎯 Current Configuration

- **Matching Mode**: Direct (BullMQ disabled)
- **Threshold**: 75%
- **CLIP Service**: http://localhost:8000
- **MongoDB**: Atlas
- **Email**: Gmail SMTP

---

## 🚦 System Health Checklist

Before testing, verify:

- [ ] CLIP service running (`curl http://localhost:8000/health`)
- [ ] Next.js server running (`http://localhost:3001`)
- [ ] MongoDB connected (check server logs)
- [ ] Email credentials configured (`.env.local`)
- [ ] `BULLMQ_ENABLED=false` in `.env.local`
- [ ] Server restarted after env changes

---

## 📝 Log Prefixes

Watch for these in server logs:

| Prefix | Meaning |
|--------|---------|
| `[MatchQueue]` | Job enqueueing/processing |
| `[Matching]` | Matching logic execution |
| `[Email]` | Email sending |
| Python logs | CLIP service operations |

---

**All set! 🎉 Add items via the UI and watch the logs for matching activity.**
