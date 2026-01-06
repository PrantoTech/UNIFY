import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { 
  BookOpen, Users, CheckCircle, AlertCircle, Calendar, Target, Send
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AssignProject = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('assign');

  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    description: '',
    github_url: '',
    start_date: '',
    end_date: '',
    duration_weeks: 4,
    difficulty_level: 'intermediate',
    technologies: '',
    milestones: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch students list
      const studentsRes = await axios.get(`${API}/admin/users?role=student`, { headers });
      setStudents(studentsRes.data.users || []);

      // Fetch assigned projects
      const projectsRes = await axios.get(`${API}/admin/projects`, { headers });
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load students or projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.student_id) {
      toast.error('Please select a student');
      return false;
    }
    if (!formData.title) {
      toast.error('Please enter project title');
      return false;
    }
    if (!formData.description) {
      toast.error('Please enter project description');
      return false;
    }
    if (!formData.start_date) {
      toast.error('Please select start date');
      return false;
    }
    if (!formData.end_date) {
      toast.error('Please select end date');
      return false;
    }
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Parse milestones
      const milestones = formData.milestones
        ? formData.milestones.split('\n').map(m => m.trim()).filter(m => m)
        : [];

      const projectPayload = {
        student_id: formData.student_id,
        title: formData.title,
        description: formData.description,
        github_url: formData.github_url,
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration_weeks: parseInt(formData.duration_weeks),
        difficulty_level: formData.difficulty_level,
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(t => t),
        milestones: milestones
      };

      await axios.post(`${API}/projects/create`, projectPayload, { headers });
      
      toast.success('Project assigned successfully!');
      
      // Reset form
      setFormData({
        student_id: '',
        title: '',
        description: '',
        github_url: '',
        start_date: '',
        end_date: '',
        duration_weeks: 4,
        difficulty_level: 'intermediate',
        technologies: '',
        milestones: ''
      });

      // Refresh projects list
      fetchData();
      setActiveTab('view');
    } catch (error) {
      console.error('Error assigning project:', error);
      toast.error(error.response?.data?.detail || 'Failed to assign project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-0">
            <BookOpen className="h-3 w-3 mr-1" /> Project Management
          </Badge>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit'] mb-2">
            Assign Projects to Students
          </h1>
          <p className="text-white/80 max-w-lg">
            Create and assign new projects to students to track their progress and development.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab('assign')}
          variant={activeTab === 'assign' ? 'default' : 'outline'}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Assign New Project
        </Button>
        <Button
          onClick={() => setActiveTab('view')}
          variant={activeTab === 'view' ? 'default' : 'outline'}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          View Assignments ({projects.length})
        </Button>
      </div>

      {/* Assign Project Form */}
      {activeTab === 'assign' && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project Assignment</CardTitle>
            <CardDescription>
              Fill in the project details and assign it to a student
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Selection */}
              <div className="space-y-2">
                <Label htmlFor="student_id">Select Student *</Label>
                <Select value={formData.student_id} onValueChange={(value) => handleSelectChange('student_id', value)}>
                  <SelectTrigger id="student_id">
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.registration_no})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., E-commerce Platform"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={formData.difficulty_level} onValueChange={(value) => handleSelectChange('difficulty_level', value)}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the project objectives, requirements, and expected outcomes..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technologies */}
                <div className="space-y-2">
                  <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                  <Input
                    id="technologies"
                    name="technologies"
                    placeholder="e.g., React, Node.js, MongoDB"
                    value={formData.technologies}
                    onChange={handleInputChange}
                  />
                </div>

                {/* GitHub URL */}
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub Repository URL</Label>
                  <Input
                    id="github_url"
                    name="github_url"
                    placeholder="https://github.com/username/repo"
                    value={formData.github_url}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration_weeks">Duration (weeks)</Label>
                  <Input
                    id="duration_weeks"
                    name="duration_weeks"
                    type="number"
                    min="1"
                    value={formData.duration_weeks}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <Label htmlFor="milestones">Milestones (one per line)</Label>
                <Textarea
                  id="milestones"
                  name="milestones"
                  placeholder="e.g., Project Setup&#10;Database Design&#10;API Development&#10;Frontend Implementation&#10;Testing & Deployment"
                  value={formData.milestones}
                  onChange={handleInputChange}
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter each milestone on a new line
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {submitting ? 'Assigning...' : 'Assign Project to Student'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* View Assignments */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading projects...</p>
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">No Projects Assigned Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating and assigning new projects to students
                </p>
                <Button onClick={() => setActiveTab('assign')}>
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map(project => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                      </div>
                      <Badge className={
                        project.status === 'active' ? 'bg-green-500' :
                        project.status === 'completed' ? 'bg-blue-500' :
                        project.status === 'cancelled' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }>
                        {project.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Student ID</p>
                        <p className="font-medium">{project.student_id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Difficulty</p>
                        <p className="font-medium capitalize">{project.difficulty_level || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium">{new Date(project.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">Technologies</p>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, idx) => (
                            <Badge key={idx} variant="secondary">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.milestones && project.milestones.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Milestones</p>
                        <ul className="space-y-1">
                          {project.milestones.map((milestone, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {milestone}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignProject;
