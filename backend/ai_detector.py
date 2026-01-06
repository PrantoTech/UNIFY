"""
AI Content Detection System for UNIFY
Detects AI-generated content in student projects and flags suspicious submissions
"""

import re
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import json
from collections import Counter
import hashlib


class AIContentDetector:
    """
    Advanced AI detection system for student projects
    - Detects AI-generated code and text
    - Analyzes writing patterns
    - Cross-references with known AI patterns
    - Flags suspicious submissions with red flag system
    """
    
    # AI detection prompts and patterns
    AI_DETECTION_PROMPTS = {
        "code_analysis": """
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
        """,
        
        "text_analysis": """
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
        """,
        
        "plagiarism_check": """
        Compare the following submissions for similarity:
        
        SUBMISSION 1:
        {submission1}
        
        SUBMISSION 2:
        {submission2}
        
        Determine:
        1. Percentage similarity
        2. Whether similarity suggests AI generation (vs. human copying)
        3. Specific matching patterns
        """
    }
    
    # Known AI patterns and signatures
    AI_SIGNATURES = {
        "code": [
            r"# This (function|method|class) (does|performs|handles)",
            r"# TODO: Implement",
            r"# Note:",
            r"# Example usage:",
            r"def\s+\w+\(.*\)\s*->\s*\w+:",  # Perfect type hints
            r"\"\"\".*\n\s+Args:\n\s+Returns:\n\s+\"\"\"",  # Perfect docstrings
            r"if __name__ == ['\"]__main__['\"]:",
            r"# Import necessary (libraries|modules)",
        ],
        "text": [
            r"In conclusion,",
            r"Furthermore,",
            r"Moreover,",
            r"It is important to note that",
            r"In today's (world|society|era)",
            r"plays a crucial role in",
            r"Let's dive (in|into)",
            r"Here's what you need to know",
        ]
    }
    
    def __init__(self, db):
        self.db = db
        self.red_flag_threshold = 70  # Confidence score threshold for red flag
        self.warning_threshold = 50   # Warning threshold
    
    async def analyze_submission(
        self, 
        student_id: str, 
        project_id: str, 
        content: str, 
        content_type: str = "code"
    ) -> Dict[str, Any]:
        """
        Comprehensive AI detection analysis for a submission
        """
        # Run multiple detection methods in parallel
        pattern_analysis = self._pattern_based_detection(content, content_type)
        statistical_analysis = self._statistical_analysis(content, content_type)
        consistency_check = await self._check_consistency(student_id, content, content_type)
        similarity_check = await self._check_similarity(content, content_type)
        
        # Combine results
        overall_confidence = self._calculate_ai_confidence(
            pattern_analysis,
            statistical_analysis,
            consistency_check,
            similarity_check
        )
        
        # Determine action
        action = self._determine_action(overall_confidence)
        
        # Create detection report
        report = {
            "id": f"detection_{project_id}_{datetime.utcnow().timestamp()}",
            "student_id": student_id,
            "project_id": project_id,
            "timestamp": datetime.utcnow().isoformat(),
            "content_type": content_type,
            "content_hash": hashlib.md5(content.encode()).hexdigest(),
            "ai_confidence_score": overall_confidence,
            "action": action,
            "pattern_analysis": pattern_analysis,
            "statistical_analysis": statistical_analysis,
            "consistency_analysis": consistency_check,
            "similarity_analysis": similarity_check,
            "indicators_found": self._collect_indicators(
                pattern_analysis,
                statistical_analysis,
                consistency_check
            ),
            "recommendation": self._generate_recommendation(overall_confidence, action)
        }
        
        # Store in database
        await self.db.ai_detections.insert_one(report)
        
        # If red flag, update student and project records
        if action == "red_flag":
            await self._flag_student(student_id, project_id, report)
        
        return report
    
    def _pattern_based_detection(self, content: str, content_type: str) -> Dict[str, Any]:
        """
        Detect AI patterns using regex and known signatures
        """
        signatures = self.AI_SIGNATURES.get(content_type, [])
        matches = []
        
        for pattern in signatures:
            found = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            if found:
                matches.append({
                    "pattern": pattern,
                    "occurrences": len(found),
                    "examples": found[:3]  # First 3 examples
                })
        
        # Calculate pattern score
        pattern_score = min(len(matches) * 15, 100)
        
        return {
            "score": pattern_score,
            "matches_found": len(matches),
            "details": matches
        }
    
    def _statistical_analysis(self, content: str, content_type: str) -> Dict[str, Any]:
        """
        Statistical analysis of content characteristics
        """
        if content_type == "code":
            return self._analyze_code_statistics(content)
        else:
            return self._analyze_text_statistics(content)
    
    def _analyze_code_statistics(self, code: str) -> Dict[str, Any]:
        """
        Analyze code for AI-typical statistical patterns
        """
        lines = code.split('\n')
        non_empty_lines = [l for l in lines if l.strip()]
        
        # Comment ratio (AI tends to over-comment)
        comment_lines = [l for l in lines if l.strip().startswith('#') or l.strip().startswith('//')]
        comment_ratio = len(comment_lines) / len(non_empty_lines) if non_empty_lines else 0
        
        # Variable naming consistency (AI uses very consistent naming)
        var_pattern = r'\b([a-z_][a-z0-9_]{2,})\b'
        variables = re.findall(var_pattern, code.lower())
        var_diversity = len(set(variables)) / len(variables) if variables else 1
        
        # Line length consistency (AI tends to keep consistent line lengths)
        line_lengths = [len(l) for l in non_empty_lines]
        avg_length = sum(line_lengths) / len(line_lengths) if line_lengths else 0
        length_variance = sum((l - avg_length) ** 2 for l in line_lengths) / len(line_lengths) if line_lengths else 0
        
        # Function/class documentation completeness
        func_pattern = r'def\s+\w+\('
        funcs = re.findall(func_pattern, code)
        docstring_pattern = r'""".*?"""'
        docstrings = re.findall(docstring_pattern, code, re.DOTALL)
        doc_ratio = len(docstrings) / len(funcs) if funcs else 0
        
        # Calculate suspicion score
        suspicion_score = 0
        
        if comment_ratio > 0.3:  # More than 30% comments is suspicious
            suspicion_score += 25
        
        if var_diversity < 0.3:  # Low variable diversity
            suspicion_score += 20
        
        if length_variance < 50:  # Very consistent line lengths
            suspicion_score += 20
        
        if doc_ratio > 0.9:  # Almost all functions documented perfectly
            suspicion_score += 35
        
        return {
            "score": min(suspicion_score, 100),
            "comment_ratio": round(comment_ratio, 2),
            "variable_diversity": round(var_diversity, 2),
            "documentation_ratio": round(doc_ratio, 2),
            "line_length_variance": round(length_variance, 2),
            "is_suspicious": suspicion_score > 50
        }
    
    def _analyze_text_statistics(self, text: str) -> Dict[str, Any]:
        """
        Analyze text for AI-typical patterns
        """
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        words = text.lower().split()
        
        # Sentence length consistency (AI tends to be very consistent)
        sent_lengths = [len(s.split()) for s in sentences]
        avg_sent_length = sum(sent_lengths) / len(sent_lengths) if sent_lengths else 0
        sent_variance = sum((l - avg_sent_length) ** 2 for l in sent_lengths) / len(sent_lengths) if sent_lengths else 0
        
        # Vocabulary diversity (AI often uses more diverse vocabulary)
        vocab_diversity = len(set(words)) / len(words) if words else 0
        
        # Grammatical perfection (count potential errors)
        # Simple checks - in production use proper grammar checker
        potential_errors = 0
        if not re.search(r'\b(gonna|wanna|gotta|kinda)\b', text.lower()):
            potential_errors += 1  # No colloquialisms
        
        if not re.search(r'\s{2,}', text):  # No double spaces (common student error)
            potential_errors += 1
        
        # Transition word overuse (AI loves these)
        transitions = ['however', 'moreover', 'furthermore', 'nevertheless', 'therefore']
        transition_count = sum(text.lower().count(t) for t in transitions)
        
        # Calculate suspicion score
        suspicion_score = 0
        
        if sent_variance < 10:  # Very consistent sentence length
            suspicion_score += 30
        
        if vocab_diversity > 0.7:  # Very high vocabulary diversity
            suspicion_score += 25
        
        if potential_errors >= 2:  # Too perfect
            suspicion_score += 25
        
        if transition_count > len(sentences) * 0.3:  # Overuse of transitions
            suspicion_score += 20
        
        return {
            "score": min(suspicion_score, 100),
            "average_sentence_length": round(avg_sent_length, 2),
            "sentence_variance": round(sent_variance, 2),
            "vocabulary_diversity": round(vocab_diversity, 2),
            "transition_word_count": transition_count,
            "is_suspicious": suspicion_score > 50
        }
    
    async def _check_consistency(
        self, 
        student_id: str, 
        content: str, 
        content_type: str
    ) -> Dict[str, Any]:
        """
        Check if submission is consistent with student's previous work
        """
        # Get student's previous submissions
        previous_submissions = await self.db.submissions.find({
            "student_id": student_id
        }).sort("submitted_at", -1).to_list(length=10)
        
        if not previous_submissions:
            return {
                "score": 0,
                "reason": "no_previous_submissions",
                "is_suspicious": False
            }
        
        # Compare with previous submissions
        style_consistency = self._compare_styles(content, previous_submissions, content_type)
        quality_jump = self._detect_quality_jump(content, previous_submissions)
        
        suspicion_score = 0
        
        if style_consistency < 0.3:  # Very different style
            suspicion_score += 40
        
        if quality_jump > 50:  # Sudden quality improvement
            suspicion_score += 60
        
        return {
            "score": min(suspicion_score, 100),
            "style_consistency": round(style_consistency, 2),
            "quality_jump": round(quality_jump, 2),
            "is_suspicious": suspicion_score > 50,
            "previous_submissions_analyzed": len(previous_submissions)
        }
    
    def _compare_styles(
        self, 
        current: str, 
        previous: List[Dict], 
        content_type: str
    ) -> float:
        """
        Compare coding/writing style consistency
        Returns value 0-1 (higher = more consistent)
        """
        if not previous:
            return 0.5  # Neutral if no history
        
        # Simple style comparison based on various metrics
        # In production, use more sophisticated style analysis
        
        if content_type == "code":
            # Compare code style metrics
            current_stats = self._analyze_code_statistics(current)
            
            style_scores = []
            for prev in previous:
                if 'content' in prev:
                    prev_stats = self._analyze_code_statistics(prev['content'])
                    
                    # Compare metrics
                    comment_diff = abs(current_stats['comment_ratio'] - prev_stats['comment_ratio'])
                    var_diff = abs(current_stats['variable_diversity'] - prev_stats['variable_diversity'])
                    
                    similarity = 1 - (comment_diff + var_diff) / 2
                    style_scores.append(max(similarity, 0))
            
            return sum(style_scores) / len(style_scores) if style_scores else 0.5
        else:
            # Compare text style
            current_stats = self._analyze_text_statistics(current)
            
            style_scores = []
            for prev in previous:
                if 'content' in prev:
                    prev_stats = self._analyze_text_statistics(prev['content'])
                    
                    sent_diff = abs(current_stats['average_sentence_length'] - prev_stats['average_sentence_length'])
                    vocab_diff = abs(current_stats['vocabulary_diversity'] - prev_stats['vocabulary_diversity'])
                    
                    similarity = 1 - (sent_diff / 50 + vocab_diff) / 2
                    style_scores.append(max(similarity, 0))
            
            return sum(style_scores) / len(style_scores) if style_scores else 0.5
    
    def _detect_quality_jump(self, current: str, previous: List[Dict]) -> float:
        """
        Detect sudden quality improvement (suspicious)
        Returns percentage of quality jump
        """
        if not previous:
            return 0
        
        # Simple quality metric based on content length and structure
        current_quality = self._estimate_quality(current)
        
        prev_qualities = []
        for prev in previous:
            if 'content' in prev:
                prev_qualities.append(self._estimate_quality(prev['content']))
        
        if not prev_qualities:
            return 0
        
        avg_prev_quality = sum(prev_qualities) / len(prev_qualities)
        
        quality_jump = ((current_quality - avg_prev_quality) / avg_prev_quality * 100) if avg_prev_quality > 0 else 0
        
        return max(quality_jump, 0)
    
    def _estimate_quality(self, content: str) -> float:
        """
        Estimate content quality (simple heuristic)
        """
        # Length
        length_score = min(len(content) / 1000, 50)
        
        # Structure (paragraphs/functions)
        structure_count = len(re.findall(r'\n\n|\ndef\s|\nclass\s', content))
        structure_score = min(structure_count * 5, 30)
        
        # Comments/documentation
        comment_count = len(re.findall(r'#|//|"""', content))
        comment_score = min(comment_count * 2, 20)
        
        return length_score + structure_score + comment_score
    
    async def _check_similarity(self, content: str, content_type: str) -> Dict[str, Any]:
        """
        Check similarity with known AI-generated content and other submissions
        """
        # Check against database of known AI outputs
        # In production, maintain a database of flagged AI content
        
        content_hash = hashlib.md5(content.encode()).hexdigest()
        
        # Check for exact or near-exact matches
        similar_submissions = await self.db.submissions.find({
            "content_hash": content_hash
        }).to_list(length=10)
        
        if similar_submissions:
            return {
                "score": 100,
                "is_suspicious": True,
                "reason": "exact_match_found",
                "matches": len(similar_submissions)
            }
        
        # Check for high similarity (would use proper similarity algorithms in production)
        # For now, return neutral score
        return {
            "score": 0,
            "is_suspicious": False,
            "matches": 0
        }
    
    def _calculate_ai_confidence(
        self,
        pattern_analysis: Dict,
        statistical_analysis: Dict,
        consistency_check: Dict,
        similarity_check: Dict
    ) -> float:
        """
        Calculate overall AI generation confidence score (0-100)
        """
        weights = {
            "pattern": 0.25,
            "statistical": 0.30,
            "consistency": 0.30,
            "similarity": 0.15
        }
        
        score = (
            pattern_analysis['score'] * weights['pattern'] +
            statistical_analysis['score'] * weights['statistical'] +
            consistency_check['score'] * weights['consistency'] +
            similarity_check['score'] * weights['similarity']
        )
        
        return round(min(score, 100), 2)
    
    def _determine_action(self, confidence_score: float) -> str:
        """
        Determine action based on confidence score
        """
        if confidence_score >= self.red_flag_threshold:
            return "red_flag"
        elif confidence_score >= self.warning_threshold:
            return "warning"
        else:
            return "clear"
    
    def _collect_indicators(
        self,
        pattern_analysis: Dict,
        statistical_analysis: Dict,
        consistency_check: Dict
    ) -> List[str]:
        """
        Collect all AI indicators found
        """
        indicators = []
        
        if pattern_analysis['matches_found'] > 0:
            indicators.append(f"Found {pattern_analysis['matches_found']} AI signature patterns")
        
        if statistical_analysis.get('is_suspicious'):
            indicators.append("Statistical analysis shows AI-typical characteristics")
        
        if consistency_check.get('is_suspicious'):
            indicators.append("Content inconsistent with student's previous work")
        
        if statistical_analysis.get('comment_ratio', 0) > 0.3:
            indicators.append("Excessive commenting (AI-typical)")
        
        if statistical_analysis.get('documentation_ratio', 0) > 0.9:
            indicators.append("Perfect documentation (unusual for students)")
        
        if consistency_check.get('quality_jump', 0) > 50:
            indicators.append(f"Sudden quality jump of {consistency_check['quality_jump']:.0f}%")
        
        return indicators
    
    def _generate_recommendation(self, confidence_score: float, action: str) -> str:
        """
        Generate recommendation based on detection results
        """
        if action == "red_flag":
            return (
                "🚩 RED FLAG: High confidence of AI-generated content detected. "
                "RECOMMENDED ACTIONS: "
                "1. Cancel project submission, "
                "2. Schedule immediate meeting with student, "
                "3. Request live coding/writing demonstration, "
                "4. Mark in student record"
            )
        elif action == "warning":
            return (
                "⚠️ WARNING: Moderate indicators of AI assistance detected. "
                "RECOMMENDED ACTIONS: "
                "1. Review submission manually, "
                "2. Ask student for clarification, "
                "3. Monitor future submissions closely"
            )
        else:
            return "✓ Content appears authentic. No significant AI indicators detected."
    
    async def _flag_student(self, student_id: str, project_id: str, report: Dict):
        """
        Apply red flag to student and project
        """
        # Update student record
        await self.db.students.update_one(
            {"id": student_id},
            {
                "$push": {
                    "red_flags": {
                        "type": "ai_detection",
                        "project_id": project_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "confidence_score": report['ai_confidence_score'],
                        "report_id": report['id']
                    }
                },
                "$set": {
                    "flagged": True,
                    "last_flag_date": datetime.utcnow().isoformat()
                }
            }
        )
        
        # Update project record
        await self.db.projects.update_one(
            {"id": project_id},
            {
                "$set": {
                    "status": "cancelled",
                    "cancellation_reason": "ai_detection",
                    "cancelled_at": datetime.utcnow().isoformat(),
                    "ai_detection_report": report['id']
                }
            }
        )
        
        # Create notification for mentor/admin
        await self.db.notifications.insert_one({
            "id": f"notif_{datetime.utcnow().timestamp()}",
            "type": "ai_detection_alert",
            "student_id": student_id,
            "project_id": project_id,
            "severity": "critical",
            "message": f"AI-generated content detected with {report['ai_confidence_score']}% confidence",
            "created_at": datetime.utcnow().isoformat(),
            "read": False
        })
    
    async def get_student_ai_history(self, student_id: str) -> Dict[str, Any]:
        """
        Get AI detection history for a student
        """
        detections = await self.db.ai_detections.find({
            "student_id": student_id
        }).sort("timestamp", -1).to_list(length=100)
        
        red_flags = [d for d in detections if d['action'] == 'red_flag']
        warnings = [d for d in detections if d['action'] == 'warning']
        
        return {
            "student_id": student_id,
            "total_detections": len(detections),
            "red_flags": len(red_flags),
            "warnings": len(warnings),
            "flagged": len(red_flags) > 0,
            "recent_detections": detections[:10],
            "risk_level": "high" if len(red_flags) > 0 else "medium" if len(warnings) > 2 else "low"
        }
