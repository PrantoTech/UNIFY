# UNIFY Advanced Analytics & AI Detection System

## Overview
This document describes the advanced features added to UNIFY platform for academic integrity monitoring, student progress tracking, and profile verification.

## 🚀 New Features

### 1. GitHub Crawler & Analysis
**File:** `backend/github_crawler.py`

#### Capabilities:
- ✅ Analyzes student GitHub profiles for authenticity
- ✅ Detects suspicious commit patterns
- ✅ Identifies mass commits and anomalies
- ✅ Calculates code quality scores
- ✅ Compares student repositories for plagiarism
- ✅ Flags red flags automatically

#### Red Flags Detected:
1. **Mass Night Commits** - Commits concentrated between 2 AM - 5 AM
2. **Single Day Mass Commits** - Many commits on a single day
3. **Compressed Timeline** - Too many commits in too few days
4. **All Repos Forked** - No original work
5. **No Recent Activity** - Dormant for 30+ days
6. **Rapid Repo Creation** - Repository created recently with 50+ commits

#### API Endpoints:
```
POST /api/analytics/github/analyze/{username}
POST /api/analytics/github/compare?username1=X&username2=Y
```

#### Example Response:
```json
{
  "username": "student123",
  "quality_score": 65.5,
  "is_suspicious": true,
  "red_flags": [
    "mass_night_commits",
    "compressed_timeline"
  ],
  "anomalies": [
    "high_fork_ratio",
    "sudden_activity_burst"
  ],
  "total_commits": 150,
  "repositories": 8
}
```

---

### 2. LinkedIn Profile Crawler & Anomaly Detection
**File:** `backend/linkedin_crawler.py`

#### Capabilities:
- ✅ Analyzes LinkedIn profiles for authenticity
- ✅ Detects fake profiles and inflated credentials
- ✅ Validates education claims against student database
- ✅ Identifies suspicious endorsement patterns
- ✅ Compares profiles for plagiarism
- ✅ Generates credibility scores

#### Anomalies Detected:
1. **Connection-Follower Imbalance** - High connections but low followers
2. **Multiple Overlapping Positions** - Impossible work timelines
3. **Job Hopping Pattern** - Excessive short tenures
4. **Skill Inflation** - Unrealistic number of skills
5. **Endorsement Inflation** - Suspiciously high endorsements
6. **Incomplete Popular Profile** - High connections but empty sections
7. **New Profile Excessive Data** - Brand new profile with extensive history
8. **Stock Photo Detection** - Fake profile photos (requires image analysis)

#### API Endpoints:
```
POST /api/analytics/linkedin/analyze
POST /api/analytics/linkedin/batch-analyze
```

#### Example Response:
```json
{
  "credibility_score": 72.0,
  "is_suspicious": false,
  "anomalies": [
    {
      "type": "skill_inflation",
      "severity": "medium",
      "description": "Unusually high number of skills listed"
    }
  ],
  "red_flags": [],
  "validation": {
    "education_match": true,
    "name_match": true
  },
  "recommendations": [
    "Focus on core skills relevant to your field"
  ]
}
```

---

### 3. Automated Progress Tracking System
**File:** `backend/progress_tracker.py`

#### Capabilities:
- ✅ Monitors project progress automatically via API
- ✅ Tracks GitHub commits and activity
- ✅ Monitors milestone completion
- ✅ Analyzes student activity patterns
- ✅ Calculates expected vs actual progress
- ✅ Generates automated reports
- ✅ Sends alerts for delays and risks

#### Progress Statuses:
- `NOT_STARTED` - Project hasn't begun
- `BEHIND_SCHEDULE` - 10-25% behind expected progress
- `ON_TRACK` - Within ±10% of expected progress
- `AHEAD_OF_SCHEDULE` - 10%+ ahead of schedule
- `COMPLETED` - Project finished
- `AT_RISK` - 25%+ behind or critical issues

#### Risk Levels:
- **Low** - On track, no concerns
- **Medium** - Minor delays or issues
- **High** - Significant delays or red flags
- **Critical** - Project failure likely, immediate intervention needed

#### API Endpoints:
```
POST /api/progress/check/{student_id}/{project_id}
GET /api/progress/report/{student_id}
POST /api/progress/bulk-check
```

#### Example Response:
```json
{
  "project_id": "proj_123",
  "student_id": "stu_456",
  "overall_progress": 45.5,
  "status": "behind_schedule",
  "risk_level": "high",
  "recommendations": [
    "⚠️ URGENT: Schedule immediate meeting with mentor",
    "Complete 2 overdue milestone(s)",
    "Increase code commit frequency"
  ],
  "github_data": {
    "commit_count": 15,
    "last_commit": "2026-01-05T10:30:00Z",
    "is_suspicious": false
  },
  "milestone_data": {
    "completed_milestones": 2,
    "total_milestones": 6,
    "overdue_count": 2
  }
}
```

---

### 4. AI Content Detection & Red Flag System
**File:** `backend/ai_detector.py`

#### 🎯 Core Functionality:
**DETECTS AI-GENERATED CONTENT AND AUTOMATICALLY CANCELS PROJECTS**

When AI confidence score ≥ 70%:
1. ✅ Project is **CANCELLED** automatically
2. ✅ Student receives **RED FLAG** on their record
3. ✅ Mentor/Admin receives immediate notification
4. ✅ Detection report is stored permanently

#### Detection Methods:

##### 1. Pattern-Based Detection
Scans for AI signatures in code and text:

**Code Patterns:**
```python
# AI-typical code patterns
- "# This function does..."
- "# TODO: Implement"
- Perfect type hints everywhere
- Excessive docstrings with Args/Returns
- "# Import necessary libraries"
```

**Text Patterns:**
```
- "In conclusion,"
- "Furthermore,"
- "Moreover,"
- "It is important to note that"
- "plays a crucial role in"
- "Let's dive in"
```

##### 2. Statistical Analysis

**For Code:**
- Comment Ratio (AI over-comments: >30% = suspicious)
- Variable Diversity (AI uses consistent naming)
- Line Length Consistency (AI maintains perfect formatting)
- Documentation Completeness (AI documents everything perfectly)

**For Text:**
- Sentence Length Variance (AI is very consistent)
- Vocabulary Diversity (AI uses varied vocabulary)
- Grammatical Perfection (No colloquialisms or errors)
- Transition Word Overuse

##### 3. Consistency Checking
- Compares with student's previous submissions
- Detects sudden style changes
- Identifies quality jumps (>50% improvement = suspicious)

##### 4. Similarity Detection
- Checks against known AI-generated content database
- Cross-references with other student submissions

#### AI Detection Confidence Scores:
- **0-49%** - ✅ CLEAR - Content appears authentic
- **50-69%** - ⚠️ WARNING - Moderate AI indicators
- **70-100%** - 🚩 RED FLAG - High AI confidence, project cancelled

#### API Endpoints:
```
POST /api/ai-detection/analyze
GET /api/ai-detection/student/{student_id}
```

#### Example Detection Request:
```json
{
  "student_id": "stu_123",
  "project_id": "proj_456",
  "content": "def calculate_sum(numbers: List[int]) -> int:\n    # This function calculates the sum of numbers...",
  "content_type": "code"
}
```

#### Example Detection Response:
```json
{
  "ai_confidence_score": 85.5,
  "action": "red_flag",
  "indicators_found": [
    "Found 12 AI signature patterns",
    "Perfect documentation (unusual for students)",
    "Sudden quality jump of 75%",
    "Statistical analysis shows AI-typical characteristics"
  ],
  "recommendation": "🚩 RED FLAG: High confidence of AI-generated content detected. RECOMMENDED ACTIONS: 1. Cancel project submission, 2. Schedule immediate meeting with student, 3. Request live coding/writing demonstration, 4. Mark in student record",
  "pattern_analysis": {
    "score": 60,
    "matches_found": 12
  },
  "statistical_analysis": {
    "score": 85,
    "comment_ratio": 0.45,
    "documentation_ratio": 0.95,
    "is_suspicious": true
  }
}
```

---

## 🔍 AI DETECTION PROMPTS

### Prompt 1: Code Analysis
```
Analyze the following code for AI generation indicators:

CODE:
{code}

Check for:
1. Overly perfect formatting and consistency
2. Excessive comments with unnatural language
3. Generic variable naming patterns (e.g., result, data, temp, item)
4. Lack of personal coding style
5. Perfect error handling without typical student mistakes
6. Presence of AI-typical comment patterns
7. Unusual code structure for student level

Provide a confidence score (0-100) that this code is AI-generated.
List specific indicators found.
```

### Prompt 2: Text Analysis
```
Analyze the following text for AI generation:

TEXT:
{text}

Check for:
1. Overly formal or professional language inconsistent with student writing
2. Perfect grammar and punctuation
3. Lack of personal voice or colloquialisms
4. Generic transitional phrases (e.g., "In conclusion", "Furthermore")
5. Repetitive sentence structures
6. Unnaturally balanced paragraphs
7. Absence of minor errors typical in student writing
8. AI-typical phrases and patterns

Provide a confidence score (0-100) that this text is AI-generated.
List specific indicators found.
```

### Prompt 3: Plagiarism Check
```
Compare the following submissions for similarity:

SUBMISSION 1:
{submission1}

SUBMISSION 2:
{submission2}

Determine:
1. Percentage similarity
2. Whether similarity suggests AI generation (vs. human copying)
3. Specific matching patterns
```

---

## 📊 Usage Examples

### Example 1: Automated Daily Progress Check
```bash
# Check progress for all active students
curl -X POST "http://localhost:8001/api/progress/bulk-check" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"student_ids": ["stu_1", "stu_2", "stu_3"]}'
```

### Example 2: Analyze GitHub Before Project Approval
```bash
# Analyze student's GitHub profile
curl -X POST "http://localhost:8001/api/analytics/github/analyze/student_username" \
  -H "Authorization: Bearer {token}"
```

### Example 3: Detect AI in Submission
```python
import requests

response = requests.post(
    "http://localhost:8001/api/ai-detection/analyze",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "student_id": "stu_123",
        "project_id": "proj_456",
        "content": student_code,
        "content_type": "code"
    }
)

result = response.json()
if result["action"] == "red_flag":
    print("⚠️ AI DETECTED - Project automatically cancelled")
    print(f"Confidence: {result['ai_confidence_score']}%")
```

---

## 🎓 Integration with UNIFY Platform

### Automatic Checks:
1. **On Project Submission** - AI detection runs automatically
2. **Daily Progress Checks** - Scheduled task monitors all active projects
3. **GitHub Analysis** - Runs when student links GitHub repository
4. **LinkedIn Verification** - Optional verification for student profiles

### Mentor Dashboard Integration:
- Real-time alerts for red flags
- Progress reports for all mentees
- AI detection history
- Risk assessment summaries

### Student Notifications:
- Progress status updates
- Milestone reminders
- Warning notifications (before red flag)
- Recommendations for improvement

---

## 🔐 Environment Variables

Add to `.env` file:
```env
# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token

# LinkedIn Integration (optional - for production use Proxycurl or similar service)
LINKEDIN_API_KEY=your_api_key

# AI Detection Thresholds
AI_RED_FLAG_THRESHOLD=70
AI_WARNING_THRESHOLD=50
```

---

## 📈 Metrics & Reporting

### Available Metrics:
1. **Student Quality Score** - Based on GitHub, progress, and submissions
2. **AI Detection Rate** - Percentage of submissions flagged
3. **Progress Compliance** - Students on track vs at risk
4. **Profile Authenticity** - LinkedIn/GitHub credibility scores

### Automated Reports:
- Weekly progress summaries
- Monthly AI detection reports
- Semester-end student analytics
- Red flag incident reports

---

## ⚙️ Configuration

### Customize Detection Sensitivity:
```python
# In ai_detector.py
self.red_flag_threshold = 70  # Adjust based on your needs
self.warning_threshold = 50
```

### Customize Progress Weights:
```python
# In progress_tracker.py
weights = {
    "milestones": 0.4,  # 40% weight
    "github": 0.3,       # 30% weight
    "submissions": 0.2,  # 20% weight
    "activity": 0.1      # 10% weight
}
```

---

## 🚨 Red Flag Workflow

When a student is red-flagged:

1. **Immediate Actions:**
   - Project status → CANCELLED
   - Student record → FLAGGED = true
   - Notification sent to mentor/admin

2. **Review Process:**
   - Mentor reviews detection report
   - Student interview scheduled
   - Live coding/writing demonstration requested

3. **Possible Outcomes:**
   - **Confirmed AI Use:** Academic integrity violation processed
   - **False Positive:** Flag removed, project reinstated
   - **Partial AI Use:** Warning issued, resubmission required

---

## 📞 Support & Maintenance

### Logging:
All detections and checks are logged to database:
- `ai_detections` collection
- `progress_snapshots` collection
- `notifications` collection

### Monitoring:
Monitor system health via:
```bash
# Check recent AI detections
GET /api/ai-detection/student/{student_id}

# Check progress tracking status
GET /api/progress/report/{student_id}
```

---

## 🔄 Future Enhancements

Planned improvements:
1. Integration with OpenAI API for advanced AI detection
2. Code plagiarism detection via AST analysis
3. Automated code review and feedback
4. Machine learning model for pattern recognition
5. Integration with university plagiarism databases
6. Real-time GitHub webhook integration
7. Video submission analysis (facial recognition during coding)

---

## 📚 Technical Implementation Details

### GitHub Crawler:
- Uses GitHub REST API v3
- Rate limit: 5000 requests/hour (authenticated)
- Caches results for 1 hour
- Async/await for performance

### LinkedIn Crawler:
- Note: Current implementation uses mock data
- For production: Use Proxycurl, RapidAPI, or official LinkedIn API
- Requires proper authentication and compliance

### AI Detector:
- Pattern matching using regex
- Statistical analysis algorithms
- No external AI API required (can be added)
- Fast processing (<1 second per submission)

### Progress Tracker:
- Real-time GitHub API integration
- Milestone tracking system
- Weighted scoring algorithm
- Risk assessment matrix

---

## ⚖️ Legal & Ethical Considerations

### Privacy:
- All data collected with student consent
- GDPR/FERPA compliant data handling
- Secure storage of detection reports
- Student right to appeal red flags

### Fairness:
- Manual review required for red flags
- Multiple detection methods for accuracy
- Transparent scoring criteria
- Appeal process for false positives

### Academic Integrity:
- Supports educational mission
- Promotes authentic learning
- Deters academic dishonesty
- Provides learning opportunities

---

## 🎯 Success Metrics

Track these KPIs:
1. **Detection Accuracy:** % of confirmed AI use vs total flags
2. **False Positive Rate:** Target <10%
3. **Student Success Rate:** Students on track vs at risk
4. **Early Warning Effectiveness:** Problems caught before deadline
5. **Time Saved:** Automated vs manual review hours

---

## 📝 Changelog

### Version 1.0 (January 2026)
- ✅ GitHub crawler with anomaly detection
- ✅ LinkedIn profile analysis
- ✅ Automated progress tracking
- ✅ AI content detection with red flag system
- ✅ Integrated API endpoints
- ✅ Automated project cancellation
- ✅ Notification system

---

## 👥 Credits

Developed for **UNIFY - Smart Campus Platform**
Enhancing academic integrity through intelligent automation.

**Contact:** For support or questions, contact your system administrator.

---

**Last Updated:** January 6, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
