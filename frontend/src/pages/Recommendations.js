import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import GeminiRecommendations from '@/components/GeminiRecommendations';

const RecommendationsPage = () => {
  const { studentId, projectId } = useParams();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Recommendations</h1>
            <p className="text-gray-600">
              Personalized insights and guidance powered by Google Gemini AI
            </p>
          </div>

          <GeminiRecommendations
            studentId={studentId || localStorage.getItem('userId')}
            projectId={projectId}
          />
        </div>
      </div>
    </Layout>
  );
};

export default RecommendationsPage;
