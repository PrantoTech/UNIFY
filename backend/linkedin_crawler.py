"""
LinkedIn Crawler Module for UNIFY
Analyzes LinkedIn profiles for authenticity and detects anomalies
"""

import aiohttp
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import re
from bs4 import BeautifulSoup
import json


class LinkedInCrawler:
    """
    LinkedIn profile analyzer with anomaly detection
    - Detects fake profiles and inflated credentials
    - Analyzes experience authenticity
    - Identifies suspicious endorsement patterns
    - Validates education claims
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize LinkedIn crawler
        Note: For production, use official LinkedIn API or third-party services like:
        - RapidAPI LinkedIn Profile Scraper
        - Proxycurl
        - ScrapingBee
        """
        self.api_key = api_key
        self.base_url = "https://api.linkedin.com/v2"
        self.anomaly_threshold = 3  # Number of anomalies to flag profile
    
    async def analyze_profile(self, profile_url: str, user_data: Dict = None) -> Dict[str, Any]:
        """
        Comprehensive LinkedIn profile analysis with anomaly detection
        """
        try:
            # Extract profile data (using mock data for demonstration)
            profile_data = await self._scrape_profile(profile_url)
            
            # Analyze various aspects
            anomalies = self._detect_anomalies(profile_data)
            credibility_score = self._calculate_credibility_score(profile_data)
            red_flags = self._check_red_flags(profile_data)
            validation_results = await self._validate_claims(profile_data, user_data)
            
            return {
                "profile_url": profile_url,
                "profile_data": profile_data,
                "credibility_score": credibility_score,
                "anomalies": anomalies,
                "red_flags": red_flags,
                "validation": validation_results,
                "is_suspicious": len(red_flags) >= self.anomaly_threshold,
                "recommendations": self._generate_recommendations(anomalies, red_flags),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "profile_url": profile_url,
                "error": str(e),
                "is_suspicious": True,
                "credibility_score": 0
            }
    
    async def _scrape_profile(self, profile_url: str) -> Dict[str, Any]:
        """
        Scrape LinkedIn profile data
        In production, use official API or authorized scraping services
        """
        # Mock implementation - replace with actual scraping logic
        # For production: Use Proxycurl, RapidAPI, or official LinkedIn API
        
        # Extract username from URL
        username_match = re.search(r'linkedin\.com/in/([^/]+)', profile_url)
        username = username_match.group(1) if username_match else "unknown"
        
        # Return mock data structure
        # In production, this would contain actual scraped data
        return {
            "username": username,
            "full_name": "",
            "headline": "",
            "location": "",
            "connections": 0,
            "followers": 0,
            "profile_created": None,
            "profile_photo": False,
            "banner_photo": False,
            "about_section": "",
            "experience": [],
            "education": [],
            "skills": [],
            "endorsements": {},
            "recommendations": [],
            "certifications": [],
            "languages": [],
            "profile_completeness": 0
        }
    
    def _detect_anomalies(self, profile_data: Dict) -> List[Dict[str, Any]]:
        """
        Detect various anomalies in LinkedIn profile
        """
        anomalies = []
        
        # 1. Connection count anomalies
        connections = profile_data.get('connections', 0)
        followers = profile_data.get('followers', 0)
        
        if connections > 500 and followers < 50:
            anomalies.append({
                "type": "connection_follower_imbalance",
                "severity": "medium",
                "description": "High connections but very low followers - unusual pattern"
            })
        
        if connections > 5000 and len(profile_data.get('experience', [])) < 2:
            anomalies.append({
                "type": "connections_without_experience",
                "severity": "high",
                "description": "Massive connections but minimal work experience"
            })
        
        # 2. Experience anomalies
        experiences = profile_data.get('experience', [])
        if experiences:
            # Check for overlapping positions
            overlaps = self._check_experience_overlaps(experiences)
            if overlaps > 3:
                anomalies.append({
                    "type": "multiple_overlapping_positions",
                    "severity": "medium",
                    "description": f"Found {overlaps} overlapping work positions"
                })
            
            # Check for very short tenures
            short_tenures = sum(1 for exp in experiences if self._calculate_tenure(exp) < 3)
            if short_tenures > len(experiences) * 0.7:
                anomalies.append({
                    "type": "job_hopping_pattern",
                    "severity": "low",
                    "description": "Most positions held for less than 3 months"
                })
        
        # 3. Skills and endorsements anomalies
        skills = profile_data.get('skills', [])
        endorsements = profile_data.get('endorsements', {})
        
        if len(skills) > 50:
            anomalies.append({
                "type": "skill_inflation",
                "severity": "medium",
                "description": "Unusually high number of skills listed"
            })
        
        # Check for disproportionate endorsements
        if endorsements:
            avg_endorsements = sum(endorsements.values()) / len(endorsements)
            if avg_endorsements > 99:
                anomalies.append({
                    "type": "endorsement_inflation",
                    "severity": "high",
                    "description": "Suspiciously high endorsement counts"
                })
        
        # 4. Profile completeness anomaly
        completeness = profile_data.get('profile_completeness', 0)
        if completeness == 100 and not profile_data.get('profile_photo'):
            anomalies.append({
                "type": "completeness_mismatch",
                "severity": "low",
                "description": "Claims 100% profile but missing photo"
            })
        
        # 5. Education anomalies
        education = profile_data.get('education', [])
        if len(education) > 5:
            anomalies.append({
                "type": "excessive_education",
                "severity": "medium",
                "description": "Unusually high number of educational institutions"
            })
        
        # 6. Empty profile sections
        empty_sections = 0
        if not profile_data.get('about_section'):
            empty_sections += 1
        if not experiences:
            empty_sections += 1
        if not education:
            empty_sections += 1
        
        if empty_sections >= 2 and connections > 500:
            anomalies.append({
                "type": "incomplete_popular_profile",
                "severity": "high",
                "description": "High connections but incomplete profile sections"
            })
        
        # 7. Recent profile with excessive claims
        if profile_data.get('profile_created'):
            try:
                created_date = datetime.fromisoformat(profile_data['profile_created'])
                account_age = (datetime.utcnow() - created_date).days
                
                if account_age < 90 and (len(experiences) > 5 or connections > 1000):
                    anomalies.append({
                        "type": "new_profile_excessive_data",
                        "severity": "critical",
                        "description": "Very new profile with suspiciously extensive history"
                    })
            except:
                pass
        
        return anomalies
    
    def _check_experience_overlaps(self, experiences: List[Dict]) -> int:
        """Check for overlapping work experiences"""
        overlaps = 0
        for i, exp1 in enumerate(experiences):
            for exp2 in experiences[i+1:]:
                if self._periods_overlap(
                    exp1.get('start_date'), exp1.get('end_date'),
                    exp2.get('start_date'), exp2.get('end_date')
                ):
                    overlaps += 1
        return overlaps
    
    def _periods_overlap(self, start1, end1, start2, end2) -> bool:
        """Check if two time periods overlap"""
        if not all([start1, start2]):
            return False
        
        try:
            s1 = datetime.fromisoformat(start1) if isinstance(start1, str) else start1
            s2 = datetime.fromisoformat(start2) if isinstance(start2, str) else start2
            e1 = datetime.fromisoformat(end1) if end1 and isinstance(end1, str) else datetime.utcnow()
            e2 = datetime.fromisoformat(end2) if end2 and isinstance(end2, str) else datetime.utcnow()
            
            return s1 <= e2 and s2 <= e1
        except:
            return False
    
    def _calculate_tenure(self, experience: Dict) -> int:
        """Calculate tenure in months"""
        try:
            start = datetime.fromisoformat(experience.get('start_date', ''))
            end = datetime.fromisoformat(experience.get('end_date', '')) if experience.get('end_date') else datetime.utcnow()
            return (end - start).days // 30
        except:
            return 0
    
    def _calculate_credibility_score(self, profile_data: Dict) -> float:
        """
        Calculate credibility score (0-100)
        Higher score = more credible profile
        """
        score = 0.0
        
        # Profile photo (10 points)
        if profile_data.get('profile_photo'):
            score += 10
        
        # About section (10 points)
        about = profile_data.get('about_section', '')
        if about and len(about) > 100:
            score += 10
        elif about:
            score += 5
        
        # Experience (25 points)
        experiences = profile_data.get('experience', [])
        if len(experiences) >= 3:
            score += 15
            # Quality of experience descriptions
            detailed_exp = sum(1 for exp in experiences if exp.get('description', '') and len(exp.get('description', '')) > 50)
            score += min(detailed_exp * 2, 10)
        elif len(experiences) >= 1:
            score += 10
        
        # Education (15 points)
        education = profile_data.get('education', [])
        if len(education) >= 1:
            score += 10
            if any(ed.get('degree') for ed in education):
                score += 5
        
        # Skills (10 points)
        skills = profile_data.get('skills', [])
        if 5 <= len(skills) <= 30:
            score += 10
        elif len(skills) > 0:
            score += 5
        
        # Endorsements (10 points)
        endorsements = profile_data.get('endorsements', {})
        if endorsements:
            avg_endorsements = sum(endorsements.values()) / len(endorsements)
            if 5 <= avg_endorsements <= 50:
                score += 10
            elif avg_endorsements > 0:
                score += 5
        
        # Recommendations (10 points)
        recommendations = profile_data.get('recommendations', [])
        if len(recommendations) >= 3:
            score += 10
        elif len(recommendations) >= 1:
            score += 5
        
        # Certifications (5 points)
        if profile_data.get('certifications'):
            score += 5
        
        # Connection count appropriateness (5 points)
        connections = profile_data.get('connections', 0)
        if 50 <= connections <= 2000:
            score += 5
        elif connections > 0:
            score += 2
        
        return round(min(score, 100), 2)
    
    def _check_red_flags(self, profile_data: Dict) -> List[str]:
        """
        Check for red flags indicating fake or suspicious profile
        """
        red_flags = []
        
        # No profile photo
        if not profile_data.get('profile_photo'):
            red_flags.append("no_profile_photo")
        
        # Generic/stock photo detection (would need image analysis in production)
        # red_flags.append("stock_photo_detected")
        
        # Empty critical sections
        if not profile_data.get('experience') and not profile_data.get('education'):
            red_flags.append("no_experience_or_education")
        
        # Suspicious connection patterns
        connections = profile_data.get('connections', 0)
        followers = profile_data.get('followers', 0)
        
        if connections == 0:
            red_flags.append("zero_connections")
        
        if connections > 5000 and followers < 100:
            red_flags.append("connection_bot_pattern")
        
        # Profile completeness issues
        if profile_data.get('profile_completeness', 0) < 30:
            red_flags.append("low_profile_completeness")
        
        # Recent profile with massive claims
        if profile_data.get('profile_created'):
            try:
                created_date = datetime.fromisoformat(profile_data['profile_created'])
                account_age = (datetime.utcnow() - created_date).days
                
                if account_age < 30:
                    red_flags.append("very_new_profile")
                    
                    if len(profile_data.get('experience', [])) > 3:
                        red_flags.append("new_profile_extensive_history")
            except:
                pass
        
        # All positions at unknown/unverified companies
        experiences = profile_data.get('experience', [])
        if experiences and all(not exp.get('company_verified', False) for exp in experiences):
            red_flags.append("no_verified_companies")
        
        return red_flags
    
    async def _validate_claims(self, profile_data: Dict, user_data: Optional[Dict]) -> Dict[str, Any]:
        """
        Validate profile claims against student database
        """
        validation_results = {
            "education_match": False,
            "name_match": False,
            "location_match": False,
            "mismatches": []
        }
        
        if not user_data:
            return validation_results
        
        # Validate education
        profile_education = profile_data.get('education', [])
        expected_institution = user_data.get('institution', '')
        
        if any(expected_institution.lower() in ed.get('school', '').lower() for ed in profile_education):
            validation_results['education_match'] = True
        else:
            validation_results['mismatches'].append("education_institution_mismatch")
        
        # Validate name
        profile_name = profile_data.get('full_name', '').lower()
        user_name = user_data.get('name', '').lower()
        
        if profile_name and user_name:
            # Fuzzy match (simple implementation)
            name_similarity = sum(1 for a, b in zip(profile_name, user_name) if a == b) / max(len(profile_name), len(user_name))
            validation_results['name_match'] = name_similarity > 0.7
            
            if not validation_results['name_match']:
                validation_results['mismatches'].append("name_mismatch")
        
        return validation_results
    
    def _generate_recommendations(self, anomalies: List[Dict], red_flags: List[str]) -> List[str]:
        """
        Generate recommendations for improving profile credibility
        """
        recommendations = []
        
        if "no_profile_photo" in red_flags:
            recommendations.append("Add a professional profile photo")
        
        if "low_profile_completeness" in red_flags:
            recommendations.append("Complete all profile sections for better credibility")
        
        if any(a['type'] == 'skill_inflation' for a in anomalies):
            recommendations.append("Focus on core skills relevant to your field")
        
        if any(a['type'] == 'job_hopping_pattern' for a in anomalies):
            recommendations.append("Consider adding more details to short-term positions")
        
        if "no_verified_companies" in red_flags:
            recommendations.append("Add positions at verified/recognized organizations")
        
        if not recommendations:
            recommendations.append("Profile looks good - maintain authenticity")
        
        return recommendations
    
    async def batch_analyze_profiles(self, profile_urls: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze multiple LinkedIn profiles in parallel
        """
        tasks = [self.analyze_profile(url) for url in profile_urls]
        return await asyncio.gather(*tasks)
    
    def compare_profiles(self, profile1: Dict, profile2: Dict) -> Dict[str, Any]:
        """
        Compare two profiles for similarity (potential plagiarism/copying)
        """
        similarities = []
        
        # Compare headlines
        if profile1.get('headline') and profile2.get('headline'):
            headline_similarity = self._text_similarity(
                profile1['headline'], 
                profile2['headline']
            )
            if headline_similarity > 0.8:
                similarities.append("nearly_identical_headlines")
        
        # Compare about sections
        if profile1.get('about_section') and profile2.get('about_section'):
            about_similarity = self._text_similarity(
                profile1['about_section'],
                profile2['about_section']
            )
            if about_similarity > 0.7:
                similarities.append("very_similar_about_sections")
        
        # Compare skills
        skills1 = set(profile1.get('skills', []))
        skills2 = set(profile2.get('skills', []))
        if skills1 and skills2:
            skill_overlap = len(skills1.intersection(skills2)) / len(skills1.union(skills2))
            if skill_overlap > 0.9:
                similarities.append("nearly_identical_skills")
        
        return {
            "is_suspicious": len(similarities) >= 2,
            "similarities_found": similarities,
            "recommendation": "Manual review recommended" if len(similarities) >= 2 else "Profiles appear distinct"
        }
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate simple text similarity (0-1)
        In production, use more sophisticated NLP methods
        """
        if not text1 or not text2:
            return 0.0
        
        # Simple word-based similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
