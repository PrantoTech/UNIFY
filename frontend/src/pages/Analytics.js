import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API_BASE = 'http://localhost:8001/api';

const Analytics = () => {
    const [loading, setLoading] = useState(false);
    const [githubData, setGithubData] = useState(null);
    const [linkedinData, setLinkedinData] = useState(null);
    const [aiData, setAiData] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [error, setError] = useState('');

    const getToken = () => localStorage.getItem('token');

    // GitHub Analysis
    const handleGithubAnalysis = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(
                `${API_BASE}/analytics/github/analyze/${username}`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setGithubData(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to analyze GitHub profile');
        } finally {
            setLoading(false);
        }
    };

    // LinkedIn Analysis
    const handleLinkedinAnalysis = async (e) => {
        e.preventDefault();
        const profileUrl = e.target.profileUrl.value;
        const studentId = e.target.studentId.value;
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(
                `${API_BASE}/analytics/linkedin/analyze`,
                { profile_url: profileUrl, student_id: studentId },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setLinkedinData(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to analyze LinkedIn profile');
        } finally {
            setLoading(false);
        }
    };

    // AI Detection
    const handleAIDetection = async (e) => {
        e.preventDefault();
        const studentId = e.target.studentId.value;
        const projectId = e.target.projectId.value;
        const content = e.target.content.value;
        const contentType = e.target.contentType.value;
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(
                `${API_BASE}/ai-detection/analyze`,
                {
                    student_id: studentId,
                    project_id: projectId,
                    content: content,
                    content_type: contentType
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setAiData(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to detect AI content');
        } finally {
            setLoading(false);
        }
    };

    // Progress Check
    const handleProgressCheck = async (e) => {
        e.preventDefault();
        const studentId = e.target.studentId.value;
        const projectId = e.target.projectId.value;
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(
                `${API_BASE}/progress/check/${studentId}/${projectId}`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setProgressData(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to check progress');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🔬 Advanced Analytics Dashboard</h1>
                <p className="text-gray-600">Analyze GitHub profiles, LinkedIn profiles, detect AI content, and track student progress</p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="github" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="github">🐙 GitHub</TabsTrigger>
                    <TabsTrigger value="linkedin">💼 LinkedIn</TabsTrigger>
                    <TabsTrigger value="ai">🤖 AI Detection</TabsTrigger>
                    <TabsTrigger value="progress">📊 Progress</TabsTrigger>
                </TabsList>

                {/* GitHub Analysis Tab */}
                <TabsContent value="github">
                    <Card>
                        <CardHeader>
                            <CardTitle>GitHub Profile Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleGithubAnalysis} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">GitHub Username</label>
                                    <Input 
                                        name="username" 
                                        placeholder="e.g., torvalds" 
                                        required 
                                    />
                                </div>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Analyzing...' : 'Analyze GitHub Profile'}
                                </Button>
                            </form>

                            {githubData && (
                                <div className="mt-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{githubData.quality_score}</div>
                                                <p className="text-xs text-gray-500">Quality Score</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{githubData.repositories}</div>
                                                <p className="text-xs text-gray-500">Repositories</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{githubData.total_commits}</div>
                                                <p className="text-xs text-gray-500">Total Commits</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Badge variant={githubData.is_suspicious ? 'destructive' : 'default'}>
                                                    {githubData.is_suspicious ? 'Suspicious' : 'Clean'}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {githubData.red_flags && githubData.red_flags.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">🚩 Red Flags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {githubData.red_flags.map((flag, idx) => (
                                                    <Badge key={idx} variant="destructive">{flag}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {githubData.anomalies && githubData.anomalies.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">⚠️ Anomalies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {githubData.anomalies.map((anomaly, idx) => (
                                                    <Badge key={idx} variant="outline">{anomaly}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* LinkedIn Analysis Tab */}
                <TabsContent value="linkedin">
                    <Card>
                        <CardHeader>
                            <CardTitle>LinkedIn Profile Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLinkedinAnalysis} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">LinkedIn Profile URL</label>
                                    <Input 
                                        name="profileUrl" 
                                        placeholder="https://linkedin.com/in/username" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Student ID (Optional)</label>
                                    <Input 
                                        name="studentId" 
                                        placeholder="STU001" 
                                    />
                                </div>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Analyzing...' : 'Analyze LinkedIn Profile'}
                                </Button>
                            </form>

                            {linkedinData && (
                                <div className="mt-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{linkedinData.credibility_score}</div>
                                                <p className="text-xs text-gray-500">Credibility Score</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Badge variant={linkedinData.is_suspicious ? 'destructive' : 'default'}>
                                                    {linkedinData.is_suspicious ? 'Suspicious' : 'Authentic'}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {linkedinData.anomalies && linkedinData.anomalies.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">⚠️ Anomalies Detected</h3>
                                            <div className="space-y-2">
                                                {linkedinData.anomalies.map((anomaly, idx) => (
                                                    <Alert key={idx}>
                                                        <AlertDescription>
                                                            <strong>{anomaly.type}:</strong> {anomaly.description} 
                                                            <Badge className="ml-2" variant={
                                                                anomaly.severity === 'critical' ? 'destructive' : 
                                                                anomaly.severity === 'high' ? 'destructive' : 
                                                                'outline'
                                                            }>
                                                                {anomaly.severity}
                                                            </Badge>
                                                        </AlertDescription>
                                                    </Alert>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {linkedinData.recommendations && linkedinData.recommendations.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">💡 Recommendations</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {linkedinData.recommendations.map((rec, idx) => (
                                                    <li key={idx}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Detection Tab */}
                <TabsContent value="ai">
                    <Card>
                        <CardHeader>
                            <CardTitle>🤖 AI Content Detection</CardTitle>
                            <Alert variant="destructive">
                                <AlertDescription>
                                    ⚠️ <strong>Warning:</strong> Projects with AI confidence ≥70% will be automatically CANCELLED and students RED FLAGGED
                                </AlertDescription>
                            </Alert>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAIDetection} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Student ID</label>
                                        <Input name="studentId" placeholder="STU001" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Project ID</label>
                                        <Input name="projectId" placeholder="PROJ001" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Content Type</label>
                                    <select name="contentType" className="w-full p-2 border rounded-md">
                                        <option value="code">Code</option>
                                        <option value="text">Text/Essay</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Content to Analyze</label>
                                    <Textarea 
                                        name="content" 
                                        placeholder="Paste code or text here..."
                                        rows={10}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="destructive" disabled={loading}>
                                    {loading ? 'Analyzing...' : 'Detect AI Content'}
                                </Button>
                            </form>

                            {aiData && (
                                <div className="mt-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-3xl font-bold text-red-600">
                                                    {aiData.ai_confidence_score}%
                                                </div>
                                                <p className="text-sm text-gray-500">AI Confidence Score</p>
                                                <Progress value={aiData.ai_confidence_score} className="mt-2" />
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Badge 
                                                    variant={aiData.action === 'red_flag' ? 'destructive' : aiData.action === 'warning' ? 'outline' : 'default'}
                                                    className="text-lg p-2"
                                                >
                                                    {aiData.action === 'red_flag' ? '🚨 RED FLAG - PROJECT CANCELLED' : 
                                                     aiData.action === 'warning' ? '⚠️ WARNING' : '✅ CLEAR'}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {aiData.indicators_found && aiData.indicators_found.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">🔍 AI Indicators Found</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {aiData.indicators_found.map((indicator, idx) => (
                                                    <li key={idx} className="text-red-600">{indicator}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <Alert variant={aiData.action === 'red_flag' ? 'destructive' : 'default'}>
                                        <AlertDescription>
                                            <strong>Recommendation:</strong> {aiData.recommendation}
                                        </AlertDescription>
                                    </Alert>

                                    {aiData.pattern_analysis && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Pattern Analysis</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p>Score: {aiData.pattern_analysis.score}%</p>
                                                <p>Matches Found: {aiData.pattern_analysis.matches_found}</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Progress Tracking Tab */}
                <TabsContent value="progress">
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 Automated Progress Tracking</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProgressCheck} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Student ID</label>
                                        <Input name="studentId" placeholder="STU001" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Project ID</label>
                                        <Input name="projectId" placeholder="PROJ001" required />
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Checking...' : 'Check Progress'}
                                </Button>
                            </form>

                            {progressData && (
                                <div className="mt-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">{progressData.overall_progress}%</div>
                                                <p className="text-xs text-gray-500">Overall Progress</p>
                                                <Progress value={progressData.overall_progress} className="mt-2" />
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Badge variant={
                                                    progressData.status === 'on_track' ? 'default' : 
                                                    progressData.status === 'ahead' ? 'default' : 
                                                    'destructive'
                                                }>
                                                    {progressData.status}
                                                </Badge>
                                                <p className="text-xs text-gray-500 mt-2">Status</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <Badge variant={
                                                    progressData.risk_level === 'low' ? 'default' : 
                                                    progressData.risk_level === 'medium' ? 'outline' : 
                                                    'destructive'
                                                }>
                                                    {progressData.risk_level}
                                                </Badge>
                                                <p className="text-xs text-gray-500 mt-2">Risk Level</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="text-2xl font-bold">
                                                    {progressData.github_data?.commit_count || 0}
                                                </div>
                                                <p className="text-xs text-gray-500">Commits</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {progressData.milestone_data && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Milestones</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p>Completed: {progressData.milestone_data.completed_milestones} / {progressData.milestone_data.total_milestones}</p>
                                                <p>Overdue: {progressData.milestone_data.overdue_count}</p>
                                                <Progress value={progressData.milestone_data.completion_percentage} className="mt-2" />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {progressData.recommendations && progressData.recommendations.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">💡 Recommendations</h3>
                                            <ul className="list-disc list-inside space-y-1">
                                                {progressData.recommendations.map((rec, idx) => (
                                                    <li key={idx} className={rec.includes('URGENT') ? 'text-red-600 font-bold' : ''}>
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Analytics;
