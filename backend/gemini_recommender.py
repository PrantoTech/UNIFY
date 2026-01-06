"""
Gemini API-based AI Recommendation System for UNIFY
Provides personalized AI recommendations for student projects, progress, and learning
"""

import os
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import google.generativeai as genai
from enum import Enum


class RecommendationType(Enum):
    """Types of recommendations"""
    PROGRESS = "progress"
    LEARNING = "learning"
    TECHNICAL = "technical"
    CAREER = "career"
    PEER = "peer"
    MENTOR = "mentor"


class GeminiRecommender:
    """
    AI-powered recommendation system using Google Gemini API
    Provides intelligent suggestions based on student data and project progress
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini recommender
        
        Args:
            api_key: Google Gemini API key (defaults to GEMINI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')
        self.chat_history = {}
    
    async def get_progress_recommendations(
        self,
        student_id: str,
        project_data: Dict[str, Any],
        progress_status: str,
        risk_level: str,
        github_data: Dict[str, Any],
        milestone_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate AI recommendations based on project progress
        
        Args:
            student_id: Student identifier
            project_data: Project information
            progress_status: Current progress status (not_started, behind_schedule, on_track, etc.)
            risk_level: Risk assessment (low, medium, high, critical)
            github_data: GitHub activity and statistics
            milestone_data: Milestone completion data
            
        Returns:
            Dictionary with AI-generated recommendations
        """
        
        prompt = self._build_progress_prompt(
            student_id,
            project_data,
            progress_status,
            risk_level,
            github_data,
            milestone_data
        )
        
        try:
            response = await asyncio.to_thread(
                self._call_gemini,
                prompt
            )
            
            recommendations = self._parse_recommendations(response, RecommendationType.PROGRESS)
            
            return {
                "success": True,
                "type": "progress",
                "student_id": student_id,
                "project_id": project_data.get("id"),
                "generated_at": datetime.utcnow().isoformat(),
                "risk_level": risk_level,
                "recommendations": recommendations,
                "raw_response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "progress"
            }
    
    async def get_learning_recommendations(
        self,
        student_id: str,
        skills: List[str],
        current_level: str,
        goal: str,
        project_type: str
    ) -> Dict[str, Any]:
        """
        Generate personalized learning path recommendations
        
        Args:
            student_id: Student identifier
            skills: List of current skills
            current_level: Current skill level (beginner, intermediate, advanced)
            goal: Learning goal
            project_type: Type of project (web, mobile, data-science, etc.)
            
        Returns:
            Dictionary with learning recommendations
        """
        
        prompt = f"""You are an expert educational consultant. Provide personalized learning recommendations for a student:

Student ID: {student_id}
Current Skills: {', '.join(skills)}
Current Level: {current_level}
Learning Goal: {goal}
Project Type: {project_type}

Please provide:
1. **Recommended Learning Path** - Step-by-step learning sequence (3-5 steps)
2. **Key Topics to Master** - Essential concepts and technologies
3. **Practice Projects** - 2-3 mini-projects to build skills
4. **Resources** - Free/premium learning resources (courses, docs, tutorials)
5. **Timeline** - Estimated weeks for each step
6. **Milestones** - Clear checkpoints to measure progress
7. **Advanced Topics** - What to learn after mastering basics
8. **Success Metrics** - How to evaluate learning progress

Format as clear, actionable recommendations with specific resources and timelines."""
        
        try:
            response = await asyncio.to_thread(
                self._call_gemini,
                prompt
            )
            
            recommendations = self._parse_recommendations(response, RecommendationType.LEARNING)
            
            return {
                "success": True,
                "type": "learning",
                "student_id": student_id,
                "current_level": current_level,
                "goal": goal,
                "generated_at": datetime.utcnow().isoformat(),
                "recommendations": recommendations,
                "raw_response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "learning"
            }
    
    async def get_technical_recommendations(
        self,
        project_data: Dict[str, Any],
        code_quality_score: float,
        issues: List[str],
        technology_stack: List[str]
    ) -> Dict[str, Any]:
        """
        Generate technical improvement recommendations for code
        
        Args:
            project_data: Project information
            code_quality_score: Quality score (0-100)
            issues: List of detected issues
            technology_stack: Technologies used
            
        Returns:
            Dictionary with technical recommendations
        """
        
        prompt = f"""You are an experienced software architect. Provide technical recommendations for a student project:

Project: {project_data.get('title', 'Unknown')}
Description: {project_data.get('description', 'No description')}
Code Quality Score: {code_quality_score}/100
Technology Stack: {', '.join(technology_stack)}
Current Issues: {', '.join(issues) if issues else 'None identified'}

Please provide:
1. **Architecture Improvements** - How to improve project structure (2-3 specific suggestions)
2. **Code Quality** - Best practices and patterns to apply
3. **Performance Optimization** - Specific areas and techniques for improvement
4. **Security Considerations** - Security best practices for this tech stack
5. **Testing Strategy** - Unit, integration, and end-to-end testing recommendations
6. **Deployment** - How to prepare for production deployment
7. **Documentation** - What documentation is needed
8. **Next Steps** - Priority order of improvements

Focus on practical, implementable recommendations with code examples where helpful."""
        
        try:
            response = await asyncio.to_thread(
                self._call_gemini,
                prompt
            )
            
            recommendations = self._parse_recommendations(response, RecommendationType.TECHNICAL)
            
            return {
                "success": True,
                "type": "technical",
                "project_id": project_data.get("id"),
                "code_quality_score": code_quality_score,
                "generated_at": datetime.utcnow().isoformat(),
                "recommendations": recommendations,
                "raw_response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "technical"
            }
    
    async def get_career_recommendations(
        self,
        student_data: Dict[str, Any],
        skills: List[str],
        interests: List[str],
        projects: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate career guidance recommendations
        
        Args:
            student_data: Student profile data
            skills: List of skills
            interests: Career interests
            projects: Portfolio projects
            
        Returns:
            Dictionary with career recommendations
        """
        
        prompt = f"""You are a career counselor specializing in tech careers. Provide career guidance for a student:

Skills: {', '.join(skills)}
Career Interests: {', '.join(interests)}
Portfolio Projects: {len(projects)} projects completed

Please provide:
1. **Career Paths** - 2-3 suitable career paths based on skills and interests
2. **Role Recommendations** - Specific job titles to target
3. **Skill Gaps** - Skills needed for target roles
4. **Portfolio Development** - Projects and experiences to build
5. **Interview Preparation** - Key topics and practice areas
6. **Networking** - How to connect with industry professionals
7. **Growth Timeline** - Expected career progression (6 months, 1 year, 3 years)
8. **Salary Expectations** - Market rates for different roles and levels

Be specific and actionable with concrete steps."""
        
        try:
            response = await asyncio.to_thread(
                self._call_gemini,
                prompt
            )
            
            recommendations = self._parse_recommendations(response, RecommendationType.CAREER)
            
            return {
                "success": True,
                "type": "career",
                "student_id": student_data.get("id"),
                "interests": interests,
                "generated_at": datetime.utcnow().isoformat(),
                "recommendations": recommendations,
                "raw_response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "career"
            }
    
    async def get_peer_matching_recommendations(
        self,
        student_id: str,
        student_skills: List[str],
        student_interests: List[str],
        all_students: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate peer collaboration recommendations
        
        Args:
            student_id: Target student identifier
            student_skills: Their skills
            student_interests: Their interests
            all_students: List of other students in platform
            
        Returns:
            Dictionary with peer matching recommendations
        """
        
        # Create simplified peer profiles
        peer_summary = []
        for peer in all_students[:10]:  # Limit to avoid huge context
            peer_summary.append({
                "id": peer.get("id"),
                "skills": peer.get("skills", []),
                "interests": peer.get("interests", [])
            })
        
        prompt = f"""You are an expert in team formation and peer collaboration. Match a student with suitable peers:

Target Student Skills: {', '.join(student_skills)}
Target Student Interests: {', '.join(student_interests)}

Available Peers (summary):
{self._format_peer_list(peer_summary)}

Please provide:
1. **Best Matches** - Top 3 peer matches with reasons for compatibility
2. **Complementary Skills** - Peers who fill skill gaps
3. **Similar Interests** - Peers with matching interests for collaboration
4. **Mentorship Opportunities** - Peers who can mentor or be mentored
5. **Project Collaboration** - Suggested joint projects based on combined skills
6. **Learning Partnerships** - How to structure pair learning
7. **Communication Tips** - How to effectively collaborate with recommended peers
8. **Expected Outcomes** - Benefits of each peer collaboration

Be specific about which peers and why they're good matches."""
        
        try:
            response = await asyncio.to_thread(
                self._call_gemini,
                prompt
            )
            
            recommendations = self._parse_recommendations(response, RecommendationType.PEER)
            
            return {
                "success": True,
                "type": "peer_matching",
                "student_id": student_id,
                "generated_at": datetime.utcnow().isoformat(),
                "recommendations": recommendations,
                "raw_response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "peer_matching"
            }
    
    async def get_mentor_guidance(
        self,
        student_id: str,
        project_data: Dict[str, Any],
        challenges: List[str],
        progress_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate guidance for mentors on how to help students
        
        Args:
            student_id: Student identifier
            project_data: Current project information
            challenges: Student's current challenges
            progress_data: Progress tracking data
            
        Returns:
            Dictionary with mentor guidance
        """
        
        prompt = f"""You are an experienced mentor. Provide guidance for mentoring a student:

Student ID: {student_id}
Project: {project_data.get('title', 'Unknown')}
Project Status: {progress_data.get('status', 'Unknown')}
Risk Level: {progress_data.get('risk_level', 'Unknown')}
Current Challenges: {', '.join(challenges) if challenges else 'None mentioned'}

Please provide:
1. **Immediate Actions** - What mentor should do in next meeting
2. **Key Discussion Topics** - What to discuss with student
3. **Mentoring Strategy** - Approach for this student based on challenges
4. **Support Resources** - Specific help or resources to provide
5. **Motivation Techniques** - How to keep student motivated
6. **Risk Mitigation** - How to prevent or recover from issues
7. **Skill Development** - Growth opportunities during mentoring
8. **Success Criteria** - How to measure effective mentoring

Be practical and mentor-focused."""
        
        try:
            response = await asyncio.to_thread(
                self._call_gemini,
                prompt
            )
            
            recommendations = self._parse_recommendations(response, RecommendationType.MENTOR)
            
            return {
                "success": True,
                "type": "mentor_guidance",
                "student_id": student_id,
                "generated_at": datetime.utcnow().isoformat(),
                "recommendations": recommendations,
                "raw_response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "mentor_guidance"
            }
    
    def _build_progress_prompt(
        self,
        student_id: str,
        project_data: Dict[str, Any],
        progress_status: str,
        risk_level: str,
        github_data: Dict[str, Any],
        milestone_data: Dict[str, Any]
    ) -> str:
        """Build detailed prompt for progress recommendations"""
        
        prompt = f"""You are an expert project manager. Analyze student project progress and provide actionable recommendations:

**Student Information:**
- Student ID: {student_id}
- Project: {project_data.get('title', 'Unknown')}
- Description: {project_data.get('description', 'No description')}
- Start Date: {project_data.get('start_date', 'Unknown')}
- Target Deadline: {project_data.get('deadline', 'Unknown')}

**Progress Status:**
- Current Status: {progress_status}
- Risk Level: {risk_level}
- Commits: {github_data.get('commit_count', 0)}
- Last Commit: {github_data.get('last_commit', 'Unknown')}

**Milestone Progress:**
- Completed: {milestone_data.get('completed_milestones', 0)}/{milestone_data.get('total_milestones', 0)}
- Overdue: {milestone_data.get('overdue_count', 0)}
- Next Milestone: {milestone_data.get('next_milestone', 'Unknown')}

Please provide:
1. **Status Analysis** - Current situation assessment
2. **Root Cause Analysis** - Why is project in current status?
3. **Immediate Actions** - What to do in next 24-48 hours
4. **Weekly Plan** - Task breakdown for next week
5. **Risk Mitigation** - How to prevent further delays
6. **Motivation Strategy** - How to regain momentum
7. **Checkpoint Meetings** - When to check progress
8. **Success Path** - Clear steps to get back on track

Be encouraging but realistic. Provide specific, actionable steps."""
        
        return prompt
    
    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API synchronously"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {str(e)}")
    
    def _parse_recommendations(
        self,
        response: str,
        rec_type: RecommendationType
    ) -> List[Dict[str, Any]]:
        """
        Parse Gemini response into structured recommendations
        
        Args:
            response: Raw response from Gemini
            rec_type: Type of recommendation
            
        Returns:
            List of parsed recommendations
        """
        
        recommendations = []
        
        # Split by numbered points (1., 2., etc.)
        import re
        sections = re.split(r'\n\d+\.\s*\*\*', response)
        
        for i, section in enumerate(sections[1:], 1):  # Skip first split (preamble)
            lines = section.split('\n')
            title = lines[0].rstrip('*').strip()
            
            # Collect content until next section
            content = '\n'.join(lines[1:]).strip()
            
            # Extract bullet points or main text
            points = []
            for line in content.split('\n'):
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•')):
                    points.append(line.lstrip('-•').strip())
                elif line and not line.startswith('#'):
                    points.append(line)
            
            recommendations.append({
                "priority": i,
                "title": title,
                "description": '\n'.join(points[:3]),  # First 3 points/lines
                "details": points,
                "type": rec_type.value
            })
        
        return recommendations
    
    def _format_peer_list(self, peers: List[Dict[str, Any]]) -> str:
        """Format peer list for prompt"""
        formatted = []
        for peer in peers:
            formatted.append(
                f"- Peer {peer['id']}: Skills: {', '.join(peer['skills'][:3])}, "
                f"Interests: {', '.join(peer['interests'][:3])}"
            )
        return '\n'.join(formatted)
