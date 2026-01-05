import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Feedback = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState({
    student_name: user?.name || '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.description.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/feedback`, feedback);
      toast.success('Feedback submitted successfully!');
      setSubmitted(true);
      setFeedback({ student_name: user?.name || '', description: '' });
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto space-y-6" data-testid="feedback-page">
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold font-['Outfit'] mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted successfully. We appreciate your input!
            </p>
            <Button onClick={() => setSubmitted(false)} className="rounded-full">
              Submit Another Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6" data-testid="feedback-page">
      <div>
        <h1 className="text-2xl font-bold font-['Outfit']">Feedback</h1>
        <p className="text-muted-foreground">Share your thoughts and suggestions with us</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-['Outfit'] flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Help us improve UNIFY by sharing your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={feedback.student_name}
                onChange={(e) => setFeedback({ ...feedback, student_name: e.target.value })}
                placeholder="Enter your name"
                data-testid="feedback-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback *</Label>
              <Textarea
                id="feedback"
                value={feedback.description}
                onChange={(e) => setFeedback({ ...feedback, description: e.target.value })}
                placeholder="Share your thoughts, suggestions, or experiences..."
                rows={6}
                data-testid="feedback-description"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-full" 
              disabled={submitting}
              data-testid="submit-feedback"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
