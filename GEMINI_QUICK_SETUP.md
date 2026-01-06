# Quick Setup: Gemini AI Recommendations

## ⚡ 5-Minute Setup Guide

### Step 1: Get Gemini API Key (2 minutes)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **"Create API Key"**
3. Create new project if needed
4. Copy the API key
5. Paste in `.env` file: `GEMINI_API_KEY=your_key_here`

### Step 2: Install Dependencies (1 minute)

```bash
cd backend
pip install google-generativeai==0.4.1
# Or just run:
pip install -r requirements.txt  # Already updated
```

### Step 3: Configure Environment (1 minute)

Create `backend/.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 4: Restart Backend (1 minute)

```bash
cd backend
python server.py
```

You should see:
```
✓ Gemini Recommender initialized
✓ Advanced analytics modules initialized
```

---

## 🧪 Test It

### Test Endpoint 1: Progress Recommendations
```bash
curl -X POST http://localhost:8001/api/recommendations/progress/stu_123/proj_456 \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json"
```

### Test Endpoint 2: Learning Recommendations
```bash
curl -X POST http://localhost:8001/api/recommendations/learning \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["Python"],
    "current_level": "intermediate",
    "goal": "Learn web development",
    "project_type": "web"
  }'
```

### Test in Frontend

1. Open browser → `http://localhost:3000`
2. Navigate to project dashboard
3. Look for "AI Recommendations" section
4. Click any recommendation type button
5. Wait 2-5 seconds for AI response

---

## ✅ Verification Checklist

- [ ] API key added to .env
- [ ] `google-generativeai` package installed
- [ ] Backend restarted successfully
- [ ] No error messages in backend logs
- [ ] Can call recommendation endpoints
- [ ] Frontend shows recommendation buttons
- [ ] Recommendations load and display

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "GEMINI_API_KEY not set" | Add GEMINI_API_KEY to .env file |
| "403 Forbidden" | Check API key is valid in Google AI Studio |
| "Gemini recommender not available" | Check backend logs for error details |
| Slow responses (>10s) | Normal for Gemini, implement caching |
| 404 on endpoints | Verify student_id and project_id exist |

---

## 📊 What You Get

### 6 New Endpoints:
1. `/api/recommendations/progress/{student_id}/{project_id}` - Project analysis
2. `/api/recommendations/learning` - Learning paths
3. `/api/recommendations/technical/{project_id}` - Code quality
4. `/api/recommendations/career` - Career guidance
5. `/api/recommendations/peer-matching` - Find partners
6. `/api/recommendations/mentor-guidance/{student_id}` - Mentor support

### Features:
- ✅ AI-powered insights
- ✅ Personalized recommendations
- ✅ Real-time analysis
- ✅ Multi-format responses
- ✅ Integration with progress tracking

---

## 🎯 Next Steps

1. **Test all endpoints** with real student data
2. **Gather feedback** from users
3. **Monitor API usage** to stay within free tier limits
4. **Implement caching** for performance
5. **Add analytics** to track effectiveness

---

## 📚 Full Documentation

For complete details, see [GEMINI_RECOMMENDATIONS.md](./GEMINI_RECOMMENDATIONS.md)

---

**Time to Setup:** ~5 minutes  
**Time to Test:** ~2 minutes  
**Total:** ~7 minutes  

You're ready to go! 🚀
