import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Complaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComplaint, setNewComplaint] = useState({
    student_name: user?.name || '',
    department: user?.department || '',
    year: user?.year || '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (user) {
      setNewComplaint(prev => ({
        ...prev,
        student_name: user.name || '',
        department: user.department || '',
        year: user.year || ''
      }));
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API}/complaints`);
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComplaint.description.trim()) {
      toast.error('Please describe your complaint');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/complaints`, newComplaint);
      setComplaints([response.data, ...complaints]);
      setNewComplaint({ ...newComplaint, description: '' });
      toast.success('Complaint submitted successfully');
    } catch (error) {
      toast.error('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
    }
  };

  const departments = [
    'Computer Science & Technology',
    'Computer Science & Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Electronics & Communication',
    'Information Technology',
  ];

  const years = ['1st', '2nd', '3rd', '4th'];

  return (
    <div className="space-y-6" data-testid="complaints-page">
      <div>
        <h1 className="text-2xl font-bold font-['Outfit']">Complaint Panel</h1>
        <p className="text-muted-foreground">Report issues and track complaint status</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Submit Complaint */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-['Outfit']">Submit New Complaint</CardTitle>
            <CardDescription>Describe your issue and we'll look into it</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input
                  value={newComplaint.student_name}
                  onChange={(e) => setNewComplaint({ ...newComplaint, student_name: e.target.value })}
                  placeholder="Your name"
                  data-testid="complaint-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={newComplaint.department}
                    onValueChange={(v) => setNewComplaint({ ...newComplaint, department: v })}
                  >
                    <SelectTrigger data-testid="complaint-department">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select
                    value={newComplaint.year}
                    onValueChange={(v) => setNewComplaint({ ...newComplaint, year: v })}
                  >
                    <SelectTrigger data-testid="complaint-year">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year} Year</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Complaint Description *</Label>
                <Textarea
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                  placeholder="Describe your complaint in detail..."
                  rows={4}
                  data-testid="complaint-description"
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={submitting} data-testid="submit-complaint">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Submit Complaint
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Complaints */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-['Outfit']">My Complaints</CardTitle>
            <CardDescription>Track the status of your submitted complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No complaints submitted yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="p-4 rounded-lg bg-secondary/50" data-testid={`complaint-${complaint.id}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">{complaint.student_name}</span>
                      {getStatusBadge(complaint.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{complaint.description}</p>
                    <div className="text-xs text-muted-foreground">
                      {complaint.department} • {complaint.year} Year
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Complaints;
