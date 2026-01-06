"""
GitHub Crawler Module for UNIFY
Analyzes student GitHub profiles for project authenticity and contribution quality
"""

import aiohttp
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import re
from collections import Counter
import json


class GitHubCrawler:
    """
    Advanced GitHub crawler for analyzing student contributions
    - Detects commit patterns and anomalies
    - Analyzes code contribution quality
    - Identifies suspicious activity patterns
    """
    
    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "UNIFY-Campus-Platform"
        }
        if github_token:
            self.headers["Authorization"] = f"token {github_token}"
    
    async def analyze_student_profile(self, username: str) -> Dict[str, Any]:
        """
        Comprehensive analysis of student GitHub profile
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Gather all data in parallel
                user_data, repos, contributions, events = await asyncio.gather(
                    self._get_user_info(session, username),
                    self._get_repositories(session, username),
                    self._get_contribution_stats(session, username),
                    self._get_recent_events(session, username)
                )
                
                # Analyze patterns
                anomalies = self._detect_anomalies(repos, contributions, events)
                quality_score = self._calculate_quality_score(repos, contributions)
                red_flags = self._check_red_flags(repos, contributions, events)
                
                return {
                    "username": username,
                    "profile": user_data,
                    "repositories": len(repos),
                    "total_commits": contributions.get("total_commits", 0),
                    "quality_score": quality_score,
                    "anomalies": anomalies,
                    "red_flags": red_flags,
                    "is_suspicious": len(red_flags) > 2,
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "detailed_repos": repos[:10]  # Top 10 repos
                }
        except Exception as e:
            return {
                "username": username,
                "error": str(e),
                "is_suspicious": False,
                "quality_score": 0
            }
    
    async def _get_user_info(self, session: aiohttp.ClientSession, username: str) -> Dict:
        """Fetch user profile information"""
        url = f"{self.base_url}/users/{username}"
        async with session.get(url, headers=self.headers) as response:
            if response.status == 200:
                return await response.json()
            return {}
    
    async def _get_repositories(self, session: aiohttp.ClientSession, username: str) -> List[Dict]:
        """Fetch user repositories with detailed info"""
        url = f"{self.base_url}/users/{username}/repos?per_page=100&sort=updated"
        async with session.get(url, headers=self.headers) as response:
            if response.status == 200:
                repos = await response.json()
                # Enhance with commit data
                enhanced_repos = []
                for repo in repos[:20]:  # Limit to 20 most recent
                    commits = await self._get_repo_commits(session, username, repo['name'])
                    repo['commit_count'] = len(commits)
                    repo['commit_pattern'] = self._analyze_commit_pattern(commits)
                    enhanced_repos.append(repo)
                return enhanced_repos
            return []
    
    async def _get_repo_commits(self, session: aiohttp.ClientSession, username: str, repo_name: str) -> List[Dict]:
        """Fetch commits for a specific repository"""
        url = f"{self.base_url}/repos/{username}/{repo_name}/commits?per_page=100"
        async with session.get(url, headers=self.headers) as response:
            if response.status == 200:
                return await response.json()
            return []
    
    async def _get_contribution_stats(self, session: aiohttp.ClientSession, username: str) -> Dict:
        """Calculate contribution statistics"""
        repos = await self._get_repositories(session, username)
        total_commits = sum(repo.get('commit_count', 0) for repo in repos)
        
        return {
            "total_commits": total_commits,
            "total_repos": len(repos),
            "languages": self._extract_languages(repos),
            "avg_commits_per_repo": total_commits / len(repos) if repos else 0
        }
    
    async def _get_recent_events(self, session: aiohttp.ClientSession, username: str) -> List[Dict]:
        """Fetch recent user events"""
        url = f"{self.base_url}/users/{username}/events/public?per_page=100"
        async with session.get(url, headers=self.headers) as response:
            if response.status == 200:
                return await response.json()
            return []
    
    def _analyze_commit_pattern(self, commits: List[Dict]) -> Dict:
        """Analyze commit patterns for anomalies"""
        if not commits:
            return {"pattern": "no_commits"}
        
        # Extract commit times
        commit_hours = []
        commit_days = []
        
        for commit in commits:
            if 'commit' in commit and 'author' in commit['commit']:
                date_str = commit['commit']['author'].get('date', '')
                if date_str:
                    try:
                        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        commit_hours.append(dt.hour)
                        commit_days.append(dt.strftime('%Y-%m-%d'))
                    except:
                        pass
        
        # Detect patterns
        hour_distribution = Counter(commit_hours)
        day_distribution = Counter(commit_days)
        
        # Check for suspicious patterns
        suspicious_patterns = []
        
        # Check for commits in unusual hours (2 AM - 5 AM mass commits)
        night_commits = sum(count for hour, count in hour_distribution.items() if 2 <= hour <= 5)
        if night_commits > len(commits) * 0.5:
            suspicious_patterns.append("mass_night_commits")
        
        # Check for all commits on single day
        if len(day_distribution) == 1 and len(commits) > 10:
            suspicious_patterns.append("single_day_mass_commits")
        
        # Check for very few distinct days with many commits
        if len(day_distribution) < 3 and len(commits) > 20:
            suspicious_patterns.append("compressed_timeline")
        
        return {
            "total_commits": len(commits),
            "unique_days": len(day_distribution),
            "suspicious_patterns": suspicious_patterns,
            "hour_distribution": dict(hour_distribution),
            "is_suspicious": len(suspicious_patterns) > 0
        }
    
    def _extract_languages(self, repos: List[Dict]) -> List[str]:
        """Extract programming languages used"""
        languages = [repo.get('language') for repo in repos if repo.get('language')]
        return list(set(languages))
    
    def _detect_anomalies(self, repos: List[Dict], contributions: Dict, events: List[Dict]) -> List[str]:
        """Detect various anomalies in GitHub activity"""
        anomalies = []
        
        # Check for repository fork ratio
        if repos:
            forks = sum(1 for repo in repos if repo.get('fork', False))
            fork_ratio = forks / len(repos)
            if fork_ratio > 0.8:
                anomalies.append("high_fork_ratio")
        
        # Check for low commit count despite many repos
        if contributions.get('total_repos', 0) > 10 and contributions.get('total_commits', 0) < 50:
            anomalies.append("low_commit_to_repo_ratio")
        
        # Check for identical commit messages
        commit_messages = []
        for repo in repos[:10]:
            if 'commit_pattern' in repo:
                # This would need actual commit messages
                pass
        
        # Check for sudden activity burst
        if events:
            event_dates = []
            for event in events:
                if 'created_at' in event:
                    event_dates.append(event['created_at'][:10])
            
            date_counts = Counter(event_dates)
            if any(count > 20 for count in date_counts.values()):
                anomalies.append("sudden_activity_burst")
        
        return anomalies
    
    def _calculate_quality_score(self, repos: List[Dict], contributions: Dict) -> float:
        """
        Calculate quality score (0-100)
        Based on: original repos, commit frequency, language diversity, documentation
        """
        score = 0.0
        
        if not repos:
            return 0.0
        
        # Original repositories (30 points)
        original_repos = sum(1 for repo in repos if not repo.get('fork', False))
        original_ratio = original_repos / len(repos)
        score += original_ratio * 30
        
        # Commit activity (25 points)
        avg_commits = contributions.get('avg_commits_per_repo', 0)
        if avg_commits > 20:
            score += 25
        elif avg_commits > 10:
            score += 15
        elif avg_commits > 5:
            score += 10
        
        # Language diversity (20 points)
        languages = contributions.get('languages', [])
        lang_score = min(len(languages) * 5, 20)
        score += lang_score
        
        # Repository descriptions (15 points)
        with_description = sum(1 for repo in repos if repo.get('description'))
        desc_ratio = with_description / len(repos)
        score += desc_ratio * 15
        
        # Stars and forks (10 points)
        total_stars = sum(repo.get('stargazers_count', 0) for repo in repos)
        if total_stars > 50:
            score += 10
        elif total_stars > 20:
            score += 7
        elif total_stars > 5:
            score += 4
        
        return round(min(score, 100), 2)
    
    def _check_red_flags(self, repos: List[Dict], contributions: Dict, events: List[Dict]) -> List[str]:
        """
        Check for red flags indicating potential academic dishonesty
        """
        red_flags = []
        
        # Mass commits in short time
        for repo in repos:
            if repo.get('commit_pattern', {}).get('is_suspicious'):
                patterns = repo['commit_pattern'].get('suspicious_patterns', [])
                for pattern in patterns:
                    if pattern not in red_flags:
                        red_flags.append(pattern)
        
        # All forked repositories
        if repos and all(repo.get('fork', False) for repo in repos):
            red_flags.append("all_repos_forked")
        
        # No commits in last 30 days but project submission
        recent_events = [e for e in events if 'created_at' in e]
        if recent_events:
            latest_event = max(recent_events, key=lambda x: x['created_at'])
            try:
                latest_date = datetime.fromisoformat(latest_event['created_at'].replace('Z', '+00:00'))
                if (datetime.utcnow() - latest_date.replace(tzinfo=None)).days > 30:
                    red_flags.append("no_recent_activity")
            except:
                pass
        
        # Repository created very recently with many commits
        for repo in repos:
            try:
                created = datetime.fromisoformat(repo['created_at'].replace('Z', '+00:00'))
                days_old = (datetime.utcnow() - created.replace(tzinfo=None)).days
                commit_count = repo.get('commit_count', 0)
                
                if days_old < 2 and commit_count > 50:
                    red_flags.append("rapid_repo_creation_with_commits")
                    break
            except:
                pass
        
        return red_flags
    
    async def compare_student_repos(self, username1: str, username2: str) -> Dict[str, Any]:
        """
        Compare two student repositories for similarity (plagiarism detection)
        """
        async with aiohttp.ClientSession() as session:
            repos1 = await self._get_repositories(session, username1)
            repos2 = await self._get_repositories(session, username2)
            
            # Check for similar repo names
            names1 = set(repo['name'].lower() for repo in repos1)
            names2 = set(repo['name'].lower() for repo in repos2)
            common_names = names1.intersection(names2)
            
            similarity_score = len(common_names) / max(len(names1), len(names2), 1) * 100
            
            return {
                "students": [username1, username2],
                "common_repo_names": list(common_names),
                "similarity_score": round(similarity_score, 2),
                "is_suspicious": similarity_score > 60
            }
