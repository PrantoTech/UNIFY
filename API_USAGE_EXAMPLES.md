# UNIFY Advanced Features - API Usage Examples

## Quick Start Guide for New Features

This document provides practical examples for using the new advanced features in UNIFY.

---

## 🔐 Authentication

All API calls require authentication token:

```bash
# Login first
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mentor@campus.edu",
    "password": "mentor123"
  }'

# Response includes token:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {...}
}

# Use token in subsequent requests:
export TOKEN="eyJhbGc..."
```

---

## 1️⃣ GitHub Analysis

### Analyze Student GitHub Profile

```bash
# Basic analysis
curl -X POST "http://localhost:8001/api/analytics/github/analyze/student_github_username" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
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
  "repositories": 8,
  "detailed_repos": [...]
}
```

### Compare Two Students (Plagiarism Detection)

```bash
curl -X POST "http://localhost:8001/api/analytics/github/compare?username1=student1&username2=student2" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "students": ["student1", "student2"],
  "common_repo_names": ["final-project", "assignment-3"],
  "similarity_score": 75.5,
  "is_suspicious": true
}
```

---

## 2️⃣ LinkedIn Profile Analysis

### Analyze Single Profile

```bash
curl -X POST "http://localhost:8001/api/analytics/linkedin/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_url": "https://linkedin.com/in/student-profile",
    "student_id": "stu_123"
  }'
```

**Response:**
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
    "name_match": true,
    "mismatches": []
  },
  "recommendations": [
    "Focus on core skills relevant to your field"
  ]
}
```

### Batch Analyze Multiple Profiles

```bash
curl -X POST "http://localhost:8001/api/analytics/linkedin/batch-analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_urls": [
      "https://linkedin.com/in/student1",
      "https://linkedin.com/in/student2",
      "https://linkedin.com/in/student3"
    ]
  }'
```

---

## 3️⃣ AI Content Detection

### Detect AI in Code Submission

```bash
curl -X POST "http://localhost:8001/api/ai-detection/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "stu_123",
    "project_id": "proj_456",
    "content": "def calculate_sum(numbers: List[int]) -> int:\n    \"\"\"Calculate the sum of numbers.\n    \n    Args:\n        numbers: List of integers to sum\n        \n    Returns:\n        The sum of all numbers\n    \"\"\"\n    # This function calculates the sum\n    result = 0\n    for num in numbers:\n        result += num\n    return result",
    "content_type": "code"
  }'
```

**Response (RED FLAG):**
```json
{
  "id": "detection_proj_456_1704567890.123",
  "student_id": "stu_123",
  "project_id": "proj_456",
  "ai_confidence_score": 85.5,
  "action": "red_flag",
  "indicators_found": [
    "Found 5 AI signature patterns",
    "Perfect documentation (unusual for students)",
    "Excessive commenting (AI-typical)",
    "Statistical analysis shows AI-typical characteristics"
  ],
  "pattern_analysis": {
    "score": 60,
    "matches_found": 5
  },
  "statistical_analysis": {
    "score": 85,
    "comment_ratio": 0.35,
    "documentation_ratio": 1.0,
    "is_suspicious": true
  },
  "recommendation": "🚩 RED FLAG: High confidence of AI-generated content detected. RECOMMENDED ACTIONS: 1. Cancel project submission, 2. Schedule immediate meeting with student, 3. Request live coding/writing demonstration, 4. Mark in student record"
}
```

**What Happens Automatically:**
1. ✅ Project is CANCELLED (status → "cancelled")
2. ✅ Student is FLAGGED (flagged → true)
3. ✅ Red flag added to student record
4. ✅ Notification sent to mentor/admin

### Detect AI in Text/Essay

```bash
curl -X POST "http://localhost:8001/api/ai-detection/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "stu_123",
    "project_id": "proj_456",
    "content": "In conclusion, the implementation of artificial intelligence in modern education plays a crucial role in transforming the learning experience. Furthermore, it is important to note that...",
    "content_type": "text"
  }'
```

### Get Student's AI Detection History

```bash
curl -X GET "http://localhost:8001/api/ai-detection/student/stu_123" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "student_id": "stu_123",
  "total_detections": 5,
  "red_flags": 2,
  "warnings": 1,
  "flagged": true,
  "risk_level": "high",
  "recent_detections": [...]
}
```

---

## 4️⃣ Automated Progress Tracking

### Check Single Project Progress

```bash
curl -X POST "http://localhost:8001/api/progress/check/stu_123/proj_456" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "project_id": "proj_456",
  "student_id": "stu_123",
  "timestamp": "2026-01-06T10:30:00Z",
  "overall_progress": 45.5,
  "status": "behind_schedule",
  "risk_level": "high",
  "github_data": {
    "has_repo": true,
    "commit_count": 15,
    "last_commit": "2026-01-05T10:30:00Z",
    "activity_score": 30,
    "is_original": true,
    "commit_pattern": {
      "suspicious_patterns": [],
      "is_suspicious": false
    }
  },
  "milestone_data": {
    "total_milestones": 6,
    "completed_milestones": 2,
    "completion_percentage": 33.33,
    "overdue_count": 2,
    "overdue_milestones": [
      {
        "id": "m2",
        "name": "Design Document",
        "deadline": "2026-01-01T00:00:00Z"
      }
    ]
  },
  "recommendations": [
    "⚠️ URGENT: Schedule immediate meeting with mentor",
    "Complete 2 overdue milestone(s)",
    "Increase code commit frequency"
  ]
}
```

### Get Student Progress Report

```bash
# For all projects
curl -X GET "http://localhost:8001/api/progress/report/stu_123" \
  -H "Authorization: Bearer $TOKEN"

# For specific project
curl -X GET "http://localhost:8001/api/progress/report/stu_123?project_id=proj_456" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "student_id": "stu_123",
  "report_date": "2026-01-06T10:30:00Z",
  "total_projects": 2,
  "average_progress": 52.5,
  "at_risk_projects": 1,
  "overall_status": "needs_attention",
  "projects": [...]
}
```

### Bulk Progress Check (All Students)

```bash
curl -X POST "http://localhost:8001/api/progress/bulk-check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_ids": ["stu_1", "stu_2", "stu_3", "stu_4", "stu_5"]
  }'
```

---

## 5️⃣ Project Management

### Create Project with Tracking

```bash
curl -X POST "http://localhost:8001/api/projects/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-Commerce Web Application",
    "description": "Full-stack e-commerce platform with React and Node.js",
    "github_url": "https://github.com/student123/ecommerce-project",
    "start_date": "2026-01-01T00:00:00Z",
    "end_date": "2026-03-31T23:59:59Z",
    "duration_weeks": 12,
    "milestones": [
      {
        "id": "m1",
        "name": "Project Proposal",
        "type": "proposal",
        "deadline": "2026-01-08T23:59:59Z",
        "weight": 10,
        "completed": false
      },
      {
        "id": "m2",
        "name": "Database Design",
        "type": "design",
        "deadline": "2026-01-15T23:59:59Z",
        "weight": 15,
        "completed": false
      }
    ]
  }'
```

### Get Student Projects

```bash
curl -X GET "http://localhost:8001/api/projects/student/stu_123" \
  -H "Authorization: Bearer $TOKEN"
```

### Get All Flagged Students

```bash
curl -X GET "http://localhost:8001/api/students/flagged" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "flagged_students": [
    {
      "id": "stu_123",
      "name": "John Doe",
      "email": "john@campus.edu",
      "flagged": true,
      "red_flags": [
        {
          "type": "ai_detection",
          "project_id": "proj_456",
          "timestamp": "2026-01-06T10:30:00Z",
          "confidence_score": 85.5
        }
      ],
      "last_flag_date": "2026-01-06T10:30:00Z"
    }
  ]
}
```

---

## 📊 Python SDK Examples

### Complete Workflow Example

```python
import requests
import json

class UNIFYClient:
    def __init__(self, base_url="http://localhost:8001", token=None):
        self.base_url = base_url
        self.token = token
        self.headers = {}
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
    
    def login(self, email, password):
        """Login and get token"""
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": email, "password": password}
        )
        data = response.json()
        self.token = data["access_token"]
        self.headers["Authorization"] = f"Bearer {self.token}"
        return data
    
    def analyze_github(self, username):
        """Analyze GitHub profile"""
        response = requests.post(
            f"{self.base_url}/api/analytics/github/analyze/{username}",
            headers=self.headers
        )
        return response.json()
    
    def detect_ai(self, student_id, project_id, content, content_type="code"):
        """Detect AI in submission"""
        response = requests.post(
            f"{self.base_url}/api/ai-detection/analyze",
            headers=self.headers,
            json={
                "student_id": student_id,
                "project_id": project_id,
                "content": content,
                "content_type": content_type
            }
        )
        return response.json()
    
    def check_progress(self, student_id, project_id):
        """Check project progress"""
        response = requests.post(
            f"{self.base_url}/api/progress/check/{student_id}/{project_id}",
            headers=self.headers
        )
        return response.json()
    
    def get_flagged_students(self):
        """Get all flagged students"""
        response = requests.get(
            f"{self.base_url}/api/students/flagged",
            headers=self.headers
        )
        return response.json()

# Usage
client = UNIFYClient()

# Login
client.login("mentor@campus.edu", "mentor123")

# Analyze GitHub
github_analysis = client.analyze_github("student_username")
print(f"Quality Score: {github_analysis['quality_score']}")
print(f"Suspicious: {github_analysis['is_suspicious']}")
print(f"Red Flags: {github_analysis['red_flags']}")

# Check for AI in submission
with open("student_code.py", "r") as f:
    code = f.read()

ai_result = client.detect_ai(
    student_id="stu_123",
    project_id="proj_456",
    content=code,
    content_type="code"
)

if ai_result["action"] == "red_flag":
    print("⚠️ AI DETECTED - Project cancelled automatically!")
    print(f"Confidence: {ai_result['ai_confidence_score']}%")
    print(f"Indicators: {ai_result['indicators_found']}")
else:
    print("✅ Content appears authentic")

# Check progress
progress = client.check_progress("stu_123", "proj_456")
print(f"Progress: {progress['overall_progress']}%")
print(f"Status: {progress['status']}")
print(f"Risk Level: {progress['risk_level']}")

# Get all flagged students
flagged = client.get_flagged_students()
print(f"Total flagged students: {len(flagged['flagged_students'])}")
```

---

## 🔄 Automated Daily Tasks

### Daily Progress Check Script

```python
#!/usr/bin/env python3
"""
Daily automated progress check for all active projects
Run this script daily via cron job or task scheduler
"""

import requests
from datetime import datetime

BASE_URL = "http://localhost:8001"
TOKEN = "your_admin_token_here"

def get_all_students():
    """Get all students"""
    response = requests.get(
        f"{BASE_URL}/api/users?role=student",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    return response.json()

def bulk_progress_check(student_ids):
    """Run bulk progress check"""
    response = requests.post(
        f"{BASE_URL}/api/progress/bulk-check",
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={"student_ids": student_ids}
    )
    return response.json()

def send_alerts(results):
    """Send alerts for at-risk projects"""
    for student_report in results["results"]:
        at_risk_count = student_report["at_risk_projects"]
        if at_risk_count > 0:
            print(f"⚠️ Alert: Student {student_report['student_id']} has {at_risk_count} at-risk projects")
            # Send email/notification here

def main():
    print(f"Running daily progress check at {datetime.now()}")
    
    # Get all students
    students = get_all_students()
    student_ids = [s["id"] for s in students["users"]]
    
    # Run bulk check
    results = bulk_progress_check(student_ids)
    
    # Send alerts
    send_alerts(results)
    
    print(f"Progress check completed. Checked {len(student_ids)} students")

if __name__ == "__main__":
    main()
```

**Add to crontab (Linux/Mac):**
```bash
# Run daily at 8 AM
0 8 * * * /usr/bin/python3 /path/to/daily_progress_check.py
```

**Add to Task Scheduler (Windows):**
```powershell
# Create scheduled task
schtasks /create /tn "UNIFY Daily Progress Check" /tr "python C:\path\to\daily_progress_check.py" /sc daily /st 08:00
```

---

## 📧 Email Alert Integration

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_alert_email(student_email, mentor_email, alert_data):
    """Send alert email for red flag or at-risk project"""
    
    msg = MIMEMultipart()
    msg['From'] = "noreply@unify.edu"
    msg['To'] = mentor_email
    msg['Cc'] = "admin@unify.edu"
    msg['Subject'] = f"🚨 ALERT: Student {alert_data['student_name']} - {alert_data['alert_type']}"
    
    body = f"""
    UNIFY Platform Alert
    
    Alert Type: {alert_data['alert_type']}
    Student: {alert_data['student_name']} ({alert_data['student_id']})
    Project: {alert_data['project_title']}
    
    {'='*50}
    
    {alert_data['message']}
    
    Action Required:
    {chr(10).join(f"- {action}" for action in alert_data['actions'])}
    
    View Details: {alert_data['details_link']}
    
    ---
    UNIFY Smart Campus Platform
    Automated Alert System
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Send email
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login("your_email@gmail.com", "your_password")
        server.send_message(msg)

# Example usage
alert_data = {
    "alert_type": "AI Detection - Red Flag",
    "student_name": "John Doe",
    "student_id": "stu_123",
    "project_title": "E-Commerce Platform",
    "message": "High confidence (85.5%) of AI-generated code detected in recent submission.",
    "actions": [
        "Schedule immediate meeting with student",
        "Request live coding demonstration",
        "Review previous submissions",
        "Document evidence for integrity committee"
    ],
    "details_link": "http://localhost:3000/mentor/students/stu_123/ai-detections"
}

send_alert_email(
    "student@campus.edu",
    "mentor@campus.edu",
    alert_data
)
```

---

## 🎯 Real-World Use Cases

### Use Case 1: Submission Review Workflow

```python
def review_submission(student_id, project_id, submission_file):
    """Complete submission review workflow"""
    
    # 1. Read submission
    with open(submission_file, 'r') as f:
        content = f.read()
    
    # 2. Detect AI
    ai_result = client.detect_ai(student_id, project_id, content, "code")
    
    # 3. Check progress
    progress = client.check_progress(student_id, project_id)
    
    # 4. Analyze GitHub
    # Extract GitHub username from project
    github_analysis = client.analyze_github("student_username")
    
    # 5. Make decision
    if ai_result["action"] == "red_flag":
        return {
            "approved": False,
            "reason": "AI detection red flag",
            "action": "Project automatically cancelled",
            "next_steps": ["Schedule meeting", "Live coding demo required"]
        }
    
    if progress["risk_level"] in ["high", "critical"]:
        return {
            "approved": False,
            "reason": "Project at risk",
            "action": "Request progress update",
            "next_steps": progress["recommendations"]
        }
    
    if github_analysis["is_suspicious"]:
        return {
            "approved": False,
            "reason": "Suspicious GitHub activity",
            "action": "Manual review required",
            "next_steps": ["Verify commits", "Check collaboration"]
        }
    
    return {
        "approved": True,
        "reason": "All checks passed",
        "action": "Approve submission",
        "next_steps": ["Grade normally"]
    }
```

### Use Case 2: Weekly Mentor Report

```python
def generate_weekly_mentor_report(mentor_id):
    """Generate weekly report for mentor"""
    
    # Get all mentees
    mentees = get_mentor_students(mentor_id)
    
    report = {
        "week": datetime.now().strftime("%Y-W%U"),
        "total_students": len(mentees),
        "at_risk": 0,
        "flagged": 0,
        "on_track": 0,
        "students": []
    }
    
    for student in mentees:
        progress = client.check_progress(student["id"], student["active_project_id"])
        ai_history = client.get_student_ai_history(student["id"])
        
        student_summary = {
            "name": student["name"],
            "progress": progress["overall_progress"],
            "status": progress["status"],
            "risk_level": progress["risk_level"],
            "ai_flags": ai_history["red_flags"],
            "actions_needed": progress["recommendations"]
        }
        
        report["students"].append(student_summary)
        
        if progress["risk_level"] in ["high", "critical"]:
            report["at_risk"] += 1
        elif progress["status"] == "on_track":
            report["on_track"] += 1
        
        if ai_history["flagged"]:
            report["flagged"] += 1
    
    return report
```

---

## 🔧 Troubleshooting

### Common Issues:

**Issue: "Invalid token" error**
```bash
# Solution: Login again to get fresh token
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "yourpass"}'
```

**Issue: GitHub analysis returns empty data**
```bash
# Solution: Check if GitHub username is correct and profile is public
# Or add GITHUB_TOKEN to .env file for authenticated requests
```

**Issue: AI detection seems inaccurate**
```python
# Solution: Adjust thresholds in ai_detector.py
self.red_flag_threshold = 70  # Increase to reduce false positives
self.warning_threshold = 50   # Decrease to catch more cases
```

---

## 📚 Additional Resources

- **Main Documentation:** `ADVANCED_FEATURES_DOCUMENTATION.md`
- **AI Prompts Guide:** `AI_DETECTION_PROMPTS.md`
- **API Documentation:** Built-in Swagger UI at `http://localhost:8001/docs`
- **Source Code:** Check individual module files in `/backend`

---

**Last Updated:** January 6, 2026
**Version:** 1.0.0
