import React, { useState } from 'react';
import { AlertCircle, Loader2, Lightbulb, Target, BookOpen, Users, Brain, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GeminiRecommendations = ({ studentId, projectId }) => {
  const [activeTab, setActiveTab] = useState('progress');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:8001/api';

  const getRecommendations = async (type, data = {}) => {
    setLoading(true);
    setError(null);
    try {
      let url, method = 'POST', body = null;

      switch (type) {
        case 'progress':
          url = `${API_BASE}/recommendations/progress/${studentId}/${projectId}`;
          break;
        case 'learning':
          url = `${API_BASE}/recommendations/learning`;
          body = data;
          break;
        case 'technical':
          url = `${API_BASE}/recommendations/technical/${projectId}`;
          body = data;
          break;
        case 'career':
          url = `${API_BASE}/recommendations/career`;
          body = data;
          break;
        case 'peer':
          url = `${API_BASE}/recommendations/peer-matching`;
          body = data;
          break;
        default:
          throw new Error('Unknown recommendation type');
      }

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      };

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Gemini API is not available. Please check backend configuration.');
        }
        throw new Error(`Error: ${response.statusText}`);
      }

      const data_response = await response.json();
      setRecommendations(data_response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressClick = () => {
    setActiveTab('progress');
    getRecommendations('progress');
  };

  const handleLearningClick = () => {
    setActiveTab('learning');
    getRecommendations('learning', {
      skills: ['Python', 'JavaScript', 'React'],
      current_level: 'intermediate',
      goal: 'Master full-stack development',
      project_type: 'web',
    });
  };

  const handleTechnicalClick = () => {
    setActiveTab('technical');
    getRecommendations('technical', {
      code_quality_score: 65.5,
      issues: ['Error handling', 'Missing tests', 'Code documentation'],
      technology_stack: ['Python', 'FastAPI', 'React', 'MongoDB'],
    });
  };

  const handleCareerClick = () => {
    setActiveTab('career');
    getRecommendations('career', {
      skills: ['Python', 'JavaScript', 'React', 'Data Analysis'],
      interests: ['Web Development', 'AI/ML', 'Startups'],
      projects: [],
    });
  };

  const handlePeerClick = () => {
    setActiveTab('peer');
    getRecommendations('peer', {
      skills: ['Python', 'JavaScript'],
      interests: ['Web Development', 'Open Source'],
    });
  };

  const RecommendationCard = ({ recommendation }) => {
    const priorityColors = {
      1: 'border-red-500',
      2: 'border-yellow-500',
      3: 'border-blue-500',
      4: 'border-green-500',
    };

    return (
      <Card className={`mb-4 ${priorityColors[recommendation.priority] || 'border-gray-300'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              {recommendation.title}
            </CardTitle>
            <span className="text-sm font-semibold text-gray-500">
              Priority #{recommendation.priority}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-3">{recommendation.description}</p>
          {recommendation.details && recommendation.details.length > 0 && (
            <ul className="space-y-2">
              {recommendation.details.map((detail, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Generating AI recommendations...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!recommendations) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Click on a recommendation type to get started</p>
        </div>
      );
    }

    if (!recommendations.success) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{recommendations.error || 'Failed to get recommendations'}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {recommendations.raw_response && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">AI Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {recommendations.raw_response}
              </div>
            </CardContent>
          </Card>
        )}

        {recommendations.recommendations && recommendations.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Key Recommendations</h3>
            {recommendations.recommendations.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>
            Get personalized insights and actionable recommendations powered by Google Gemini AI
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={handleProgressClick}
          variant={activeTab === 'progress' ? 'default' : 'outline'}
          className="h-auto p-4 flex flex-col items-center justify-center gap-2"
        >
          <Zap className="w-6 h-6" />
          <span>Project Progress</span>
          <span className="text-xs opacity-70">Get progress insights</span>
        </Button>

        <Button
          onClick={handleLearningClick}
          variant={activeTab === 'learning' ? 'default' : 'outline'}
          className="h-auto p-4 flex flex-col items-center justify-center gap-2"
        >
          <BookOpen className="w-6 h-6" />
          <span>Learning Path</span>
          <span className="text-xs opacity-70">Personalized learning</span>
        </Button>

        <Button
          onClick={handleTechnicalClick}
          variant={activeTab === 'technical' ? 'default' : 'outline'}
          className="h-auto p-4 flex flex-col items-center justify-center gap-2"
        >
          <Target className="w-6 h-6" />
          <span>Code Quality</span>
          <span className="text-xs opacity-70">Technical improvements</span>
        </Button>

        <Button
          onClick={handleCareerClick}
          variant={activeTab === 'career' ? 'default' : 'outline'}
          className="h-auto p-4 flex flex-col items-center justify-center gap-2"
        >
          <Lightbulb className="w-6 h-6" />
          <span>Career Guidance</span>
          <span className="text-xs opacity-70">Career development</span>
        </Button>

        <Button
          onClick={handlePeerClick}
          variant={activeTab === 'peer' ? 'default' : 'outline'}
          className="h-auto p-4 flex flex-col items-center justify-center gap-2"
        >
          <Users className="w-6 h-6" />
          <span>Peer Matching</span>
          <span className="text-xs opacity-70">Find collaborators</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
          <TabsTrigger value="peer">Peer</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {renderContent()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert className="bg-blue-50 border-blue-200">
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          These recommendations are powered by Google Gemini AI. They analyze your project data,
          skills, and progress patterns to provide personalized insights. Recommendations are updated
          regularly as you make progress.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default GeminiRecommendations;
