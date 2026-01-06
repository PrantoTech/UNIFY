"""
Automated Progress Tracking System for UNIFY
Monitors student project progress and generates automated reports
"""

import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import json


class ProgressStatus(Enum):
    """Progress status levels"""
    NOT_STARTED = "not_started"
    BEHIND_SCHEDULE = "behind_schedule"
    ON_TRACK = "on_track"
    AHEAD_OF_SCHEDULE = "ahead"
    COMPLETED = "completed"
    AT_RISK = "at_risk"


class MilestoneType(Enum):
    """Types of project milestones"""
    PROPOSAL = "proposal"
    DESIGN = "design"
    IMPLEMENTATION = "implementation"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    PRESENTATION = "presentation"


class ProgressTracker:
    """
    Automated progress tracking system
    - Monitors GitHub commits and activity
    - Tracks milestone completion
    - Generates automated reports
    - Sends alerts for delays
    - Integrates AI recommendations via Gemini
    """
    
    def __init__(self, db, github_crawler, ai_detector, gemini_recommender=None):
        self.db = db
        self.github_crawler = github_crawler
        self.ai_detector = ai_detector
        self.gemini_recommender = gemini_recommender
    
    async def check_project_progress(self, student_id: str, project_id: str) -> Dict[str, Any]:
        """
        Comprehensive progress check for a student project
        """
        # Fetch project data
        project = await self.db.projects.find_one({"id": project_id, "student_id": student_id})
        
        if not project:
            raise ValueError(f"Project {project_id} not found for student {student_id}")
        
        # Gather all progress indicators
        github_data = await self._check_github_progress(project.get('github_url'))
        milestone_data = await self._check_milestones(project)
        submission_data = await self._check_submissions(project_id)
        activity_data = await self._check_activity_pattern(student_id, project_id)
        
        # Calculate overall progress
        overall_progress = self._calculate_overall_progress(
            github_data, milestone_data, submission_data, activity_data
        )
        
        # Determine status and risk level
        status = self._determine_status(overall_progress, project)
        risk_level = self._assess_risk(github_data, milestone_data, activity_data)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            status, risk_level, github_data, milestone_data
        )
        
        # Store progress snapshot
        progress_snapshot = {
            "id": f"progress_{project_id}_{datetime.utcnow().isoformat()}",
            "project_id": project_id,
            "student_id": student_id,
            "timestamp": datetime.utcnow().isoformat(),
            "overall_progress": overall_progress,
            "status": status.value,
            "risk_level": risk_level,
            "github_data": github_data,
            "milestone_data": milestone_data,
            "submission_data": submission_data,
            "activity_data": activity_data,
            "recommendations": recommendations
        }
        
        await self.db.progress_snapshots.insert_one(progress_snapshot)
        
        return progress_snapshot
    
    async def _check_github_progress(self, github_url: Optional[str]) -> Dict[str, Any]:
        """
        Check GitHub repository progress
        """
        if not github_url:
            return {
                "has_repo": False,
                "commit_count": 0,
                "last_commit": None,
                "activity_score": 0
            }
        
        # Extract username and repo from URL
        import re
        match = re.search(r'github\.com/([^/]+)/([^/]+)', github_url)
        if not match:
            return {"has_repo": False, "commit_count": 0}
        
        username = match.group(1)
        repo_name = match.group(2)
        
        # Use GitHub crawler to get detailed stats
        try:
            analysis = await self.github_crawler.analyze_student_profile(username)
            
            # Find specific repo
            repo_data = None
            for repo in analysis.get('detailed_repos', []):
                if repo['name'] == repo_name:
                    repo_data = repo
                    break
            
            if not repo_data:
                return {"has_repo": True, "commit_count": 0}
            
            return {
                "has_repo": True,
                "commit_count": repo_data.get('commit_count', 0),
                "last_commit": repo_data.get('updated_at'),
                "activity_score": min(repo_data.get('commit_count', 0) * 2, 100),
                "commit_pattern": repo_data.get('commit_pattern', {}),
                "is_original": not repo_data.get('fork', False)
            }
        except Exception as e:
            return {
                "has_repo": True,
                "error": str(e),
                "commit_count": 0
            }
    
    async def _check_milestones(self, project: Dict) -> Dict[str, Any]:
        """
        Check milestone completion status
        """
        milestones = project.get('milestones', [])
        
        if not milestones:
            # Create default milestones based on project type
            milestones = self._create_default_milestones(project)
        
        completed = sum(1 for m in milestones if m.get('completed', False))
        total = len(milestones)
        
        # Check for overdue milestones
        overdue = []
        upcoming = []
        
        for milestone in milestones:
            if milestone.get('completed'):
                continue
            
            deadline = milestone.get('deadline')
            if deadline:
                try:
                    deadline_date = datetime.fromisoformat(deadline)
                    days_until = (deadline_date - datetime.utcnow()).days
                    
                    if days_until < 0:
                        overdue.append(milestone)
                    elif days_until <= 7:
                        upcoming.append(milestone)
                except:
                    pass
        
        return {
            "total_milestones": total,
            "completed_milestones": completed,
            "completion_percentage": (completed / total * 100) if total > 0 else 0,
            "overdue_count": len(overdue),
            "overdue_milestones": overdue,
            "upcoming_milestones": upcoming
        }
    
    def _create_default_milestones(self, project: Dict) -> List[Dict]:
        """
        Create default milestones for a project
        """
        start_date = datetime.fromisoformat(project.get('start_date', datetime.utcnow().isoformat()))
        duration_weeks = project.get('duration_weeks', 12)
        
        milestones = [
            {
                "id": "m1",
                "name": "Project Proposal",
                "type": MilestoneType.PROPOSAL.value,
                "deadline": (start_date + timedelta(weeks=1)).isoformat(),
                "weight": 10,
                "completed": False
            },
            {
                "id": "m2",
                "name": "Design Document",
                "type": MilestoneType.DESIGN.value,
                "deadline": (start_date + timedelta(weeks=3)).isoformat(),
                "weight": 15,
                "completed": False
            },
            {
                "id": "m3",
                "name": "Implementation Phase 1",
                "type": MilestoneType.IMPLEMENTATION.value,
                "deadline": (start_date + timedelta(weeks=6)).isoformat(),
                "weight": 25,
                "completed": False
            },
            {
                "id": "m4",
                "name": "Implementation Phase 2",
                "type": MilestoneType.IMPLEMENTATION.value,
                "deadline": (start_date + timedelta(weeks=9)).isoformat(),
                "weight": 25,
                "completed": False
            },
            {
                "id": "m5",
                "name": "Testing & Documentation",
                "type": MilestoneType.TESTING.value,
                "deadline": (start_date + timedelta(weeks=11)).isoformat(),
                "weight": 15,
                "completed": False
            },
            {
                "id": "m6",
                "name": "Final Presentation",
                "type": MilestoneType.PRESENTATION.value,
                "deadline": (start_date + timedelta(weeks=duration_weeks)).isoformat(),
                "weight": 10,
                "completed": False
            }
        ]
        
        return milestones
    
    async def _check_submissions(self, project_id: str) -> Dict[str, Any]:
        """
        Check project submissions and deliverables
        """
        submissions = await self.db.submissions.find({"project_id": project_id}).to_list(length=100)
        
        return {
            "total_submissions": len(submissions),
            "recent_submission": submissions[-1] if submissions else None,
            "submission_frequency": self._calculate_submission_frequency(submissions)
        }
    
    def _calculate_submission_frequency(self, submissions: List[Dict]) -> str:
        """
        Calculate how frequently student is submitting work
        """
        if len(submissions) < 2:
            return "insufficient_data"
        
        # Calculate average days between submissions
        dates = []
        for sub in submissions:
            try:
                dates.append(datetime.fromisoformat(sub['submitted_at']))
            except:
                pass
        
        if len(dates) < 2:
            return "insufficient_data"
        
        dates.sort()
        intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        avg_interval = sum(intervals) / len(intervals)
        
        if avg_interval <= 3:
            return "very_frequent"
        elif avg_interval <= 7:
            return "frequent"
        elif avg_interval <= 14:
            return "moderate"
        elif avg_interval <= 30:
            return "infrequent"
        else:
            return "very_infrequent"
    
    async def _check_activity_pattern(self, student_id: str, project_id: str) -> Dict[str, Any]:
        """
        Check student activity pattern for the project
        """
        # Get recent activities
        activities = await self.db.activities.find({
            "student_id": student_id,
            "project_id": project_id
        }).sort("timestamp", -1).to_list(length=100)
        
        if not activities:
            return {
                "has_activity": False,
                "activity_score": 0
            }
        
        # Analyze activity timeline
        last_activity = activities[0] if activities else None
        days_since_last = None
        
        if last_activity:
            try:
                last_date = datetime.fromisoformat(last_activity['timestamp'])
                days_since_last = (datetime.utcnow() - last_date).days
            except:
                pass
        
        # Activity frequency
        activity_by_week = {}
        for activity in activities:
            try:
                date = datetime.fromisoformat(activity['timestamp'])
                week_key = date.strftime('%Y-W%U')
                activity_by_week[week_key] = activity_by_week.get(week_key, 0) + 1
            except:
                pass
        
        avg_weekly_activity = sum(activity_by_week.values()) / len(activity_by_week) if activity_by_week else 0
        
        return {
            "has_activity": True,
            "total_activities": len(activities),
            "days_since_last_activity": days_since_last,
            "average_weekly_activity": round(avg_weekly_activity, 2),
            "activity_score": min(avg_weekly_activity * 10, 100),
            "is_active": days_since_last is not None and days_since_last < 7
        }
    
    def _calculate_overall_progress(
        self, 
        github_data: Dict, 
        milestone_data: Dict, 
        submission_data: Dict, 
        activity_data: Dict
    ) -> float:
        """
        Calculate overall project progress percentage (0-100)
        """
        weights = {
            "milestones": 0.4,
            "github": 0.3,
            "submissions": 0.2,
            "activity": 0.1
        }
        
        # Milestone progress
        milestone_progress = milestone_data.get('completion_percentage', 0)
        
        # GitHub progress
        github_progress = github_data.get('activity_score', 0)
        
        # Submission progress
        submission_score = min(submission_data.get('total_submissions', 0) * 10, 100)
        
        # Activity progress
        activity_score = activity_data.get('activity_score', 0)
        
        # Weighted average
        overall = (
            milestone_progress * weights["milestones"] +
            github_progress * weights["github"] +
            submission_score * weights["submissions"] +
            activity_score * weights["activity"]
        )
        
        return round(min(overall, 100), 2)
    
    def _determine_status(self, progress: float, project: Dict) -> ProgressStatus:
        """
        Determine project status based on progress and timeline
        """
        # Calculate expected progress based on timeline
        start_date = datetime.fromisoformat(project.get('start_date', datetime.utcnow().isoformat()))
        end_date = datetime.fromisoformat(project.get('end_date', (datetime.utcnow() + timedelta(weeks=12)).isoformat()))
        
        total_duration = (end_date - start_date).days
        elapsed = (datetime.utcnow() - start_date).days
        
        if elapsed < 0:
            return ProgressStatus.NOT_STARTED
        
        if elapsed >= total_duration:
            return ProgressStatus.COMPLETED if progress >= 95 else ProgressStatus.AT_RISK
        
        expected_progress = (elapsed / total_duration) * 100
        
        # Compare actual vs expected
        difference = progress - expected_progress
        
        if difference >= 10:
            return ProgressStatus.AHEAD_OF_SCHEDULE
        elif difference >= -10:
            return ProgressStatus.ON_TRACK
        elif difference >= -25:
            return ProgressStatus.BEHIND_SCHEDULE
        else:
            return ProgressStatus.AT_RISK
    
    def _assess_risk(
        self, 
        github_data: Dict, 
        milestone_data: Dict, 
        activity_data: Dict
    ) -> str:
        """
        Assess risk level for project completion
        Returns: "low", "medium", "high", "critical"
        """
        risk_factors = 0
        
        # No GitHub activity
        if not github_data.get('has_repo') or github_data.get('commit_count', 0) < 5:
            risk_factors += 2
        
        # Overdue milestones
        overdue_count = milestone_data.get('overdue_count', 0)
        if overdue_count >= 3:
            risk_factors += 3
        elif overdue_count >= 1:
            risk_factors += 1
        
        # Inactive student
        if not activity_data.get('is_active'):
            days_inactive = activity_data.get('days_since_last_activity', 0)
            if days_inactive > 14:
                risk_factors += 2
            elif days_inactive > 7:
                risk_factors += 1
        
        # Suspicious GitHub patterns
        if github_data.get('commit_pattern', {}).get('is_suspicious'):
            risk_factors += 2
        
        # Determine risk level
        if risk_factors >= 6:
            return "critical"
        elif risk_factors >= 4:
            return "high"
        elif risk_factors >= 2:
            return "medium"
        else:
            return "low"
    
    def _generate_recommendations(
        self, 
        status: ProgressStatus, 
        risk_level: str,
        github_data: Dict,
        milestone_data: Dict
    ) -> List[str]:
        """
        Generate actionable recommendations
        """
        recommendations = []
        
        if risk_level in ["high", "critical"]:
            recommendations.append("⚠️ URGENT: Schedule immediate meeting with mentor")
        
        if not github_data.get('has_repo'):
            recommendations.append("Set up GitHub repository immediately")
        elif github_data.get('commit_count', 0) < 10:
            recommendations.append("Increase code commit frequency")
        
        if milestone_data.get('overdue_count', 0) > 0:
            recommendations.append(f"Complete {milestone_data['overdue_count']} overdue milestone(s)")
        
        if status == ProgressStatus.BEHIND_SCHEDULE:
            recommendations.append("Create catch-up plan with weekly targets")
        
        if status == ProgressStatus.AT_RISK:
            recommendations.append("Consider scope reduction or deadline extension")
        
        if github_data.get('commit_pattern', {}).get('is_suspicious'):
            recommendations.append("⚠️ Suspicious commit pattern detected - verify authenticity")
        
        if not recommendations:
            recommendations.append("✓ Project on track - maintain current pace")
        
        # Add Gemini AI recommendation flag
        if self.gemini_recommender:
            recommendations.append("💡 GET AI INSIGHTS: Use /api/recommendations/progress endpoint for detailed AI analysis")
        
        return recommendations
    
    async def generate_progress_report(
        self, 
        student_id: str, 
        project_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive progress report for student
        """
        if project_id:
            projects = [await self.db.projects.find_one({"id": project_id})]
        else:
            projects = await self.db.projects.find({"student_id": student_id}).to_list(length=100)
        
        project_reports = []
        for project in projects:
            if project:
                progress = await self.check_project_progress(student_id, project['id'])
                project_reports.append(progress)
        
        # Calculate summary statistics
        avg_progress = sum(p['overall_progress'] for p in project_reports) / len(project_reports) if project_reports else 0
        at_risk_count = sum(1 for p in project_reports if p['risk_level'] in ['high', 'critical'])
        
        return {
            "student_id": student_id,
            "report_date": datetime.utcnow().isoformat(),
            "total_projects": len(project_reports),
            "average_progress": round(avg_progress, 2),
            "at_risk_projects": at_risk_count,
            "projects": project_reports,
            "overall_status": "needs_attention" if at_risk_count > 0 else "on_track"
        }
    
    async def bulk_progress_check(self, student_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Check progress for multiple students in parallel
        """
        tasks = [self.generate_progress_report(student_id) for student_id in student_ids]
        return await asyncio.gather(*tasks)
