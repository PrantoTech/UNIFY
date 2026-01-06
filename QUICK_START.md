# 🚀 QUICK START GUIDE

## Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Start the Server
```bash
python server.py
```

Server will start at: `http://localhost:8001`

### Step 3: Test the Features

#### Login (Get Token)
```bash
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@campus.edu", "password": "admin123"}'
```

Save the token from response.

#### Test GitHub Analysis
```bash
# Replace YOUR_TOKEN with the token from login
curl -X POST "http://localhost:8001/api/analytics/github/analyze/torvalds" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test AI Detection
```bash
curl -X POST "http://localhost:8001/api/ai-detection/analyze" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test",
    "project_id": "test",
    "content": "def calculate_sum(numbers: List[int]) -> int:\n    \"\"\"This function calculates the sum.\n    \n    Args:\n        numbers: List of integers\n    Returns:\n        The sum\n    \"\"\"\n    result = 0\n    for num in numbers:\n        result += num\n    return result",
    "content_type": "code"
  }'
```

### Step 4: View API Documentation
Open in browser: `http://localhost:8001/docs`

---

## 📚 Full Documentation

- **Complete Guide:** [ADVANCED_FEATURES_DOCUMENTATION.md](ADVANCED_FEATURES_DOCUMENTATION.md)
- **AI Prompts:** [AI_DETECTION_PROMPTS.md](AI_DETECTION_PROMPTS.md)
- **API Examples:** [API_USAGE_EXAMPLES.md](API_USAGE_EXAMPLES.md)
- **Implementation Summary:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## 🔥 Key Features Added

1. **GitHub Crawler** - Analyzes profiles for authenticity
2. **LinkedIn Analyzer** - Detects fake profiles and credentials
3. **Progress Tracker** - Automated monitoring with risk assessment
4. **AI Detector** - **Automatically cancels projects when AI is detected**

---

## ⚠️ Important Notes

### AI Detection
When AI confidence ≥ 70%:
- ✅ Project is **automatically CANCELLED**
- ✅ Student receives **RED FLAG**
- ✅ Mentor is **notified immediately**

### Default Login Credentials
```
Admin:
  Email: admin@campus.edu
  Password: admin123

Student:
  Email: john@campus.edu
  Password: john123

Mentor:
  Email: jane@campus.edu
  Password: jane123
```

### Environment Variables (Optional)
Create `backend/.env`:
```env
GITHUB_TOKEN=your_token_here  # For higher rate limits
LINKEDIN_API_KEY=your_key     # For production LinkedIn scraping
```

---

## 🎯 What Each Feature Does

### GitHub Crawler
✅ Detects suspicious commit patterns  
✅ Identifies mass commits, night commits  
✅ Calculates quality scores  
✅ Compares repos for plagiarism  

### LinkedIn Analyzer
✅ Validates profile authenticity  
✅ Detects fake credentials  
✅ Identifies anomalies  
✅ Cross-checks with student data  

### Progress Tracker
✅ Monitors project progress  
✅ Tracks milestones  
✅ Assesses risk levels  
✅ Sends automated alerts  

### AI Detector
✅ Pattern-based detection  
✅ Statistical analysis  
✅ Consistency checking  
✅ **Auto-cancels projects**  
✅ **Red-flags students**  

---

## 📝 Ready-to-Use AI Prompts

Found in [AI_DETECTION_PROMPTS.md](AI_DETECTION_PROMPTS.md):

1. **Code Analysis Prompt** - Detect AI-generated code
2. **Text Analysis Prompt** - Detect AI-written essays
3. **Plagiarism Check Prompt** - Compare submissions
4. **Progress Check Prompt** - Verify project authenticity
5. **Live Coding Prompt** - Assess student during interview
6. **Batch Analysis Prompt** - Check entire class

Copy-paste ready for ChatGPT/Claude!

---

## 🎉 You're All Set!

All features are:
- ✅ Fully implemented
- ✅ Tested and working
- ✅ Documented completely
- ✅ Ready for production

**Start the server and explore!**
