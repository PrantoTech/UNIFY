import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Users, Calendar, MessageSquare, FileText, ChevronRight, AlertCircle,
  BarChart3, TrendingUp, Shield, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, complaintsRes] = await Promise.all([
        axios.get(`${API}/analytics`),
        axios.get(`${API}/complaints`),
      ]);
      setAnalytics(analyticsRes.data);
      setComplaints(complaintsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = analytics ? [
    { name: 'Students', value: analytics.total_students },
    { name: 'Mentors', value: analytics.total_mentors },
    { name: 'Posts', value: analytics.total_posts },
    { name: 'Events', value: analytics.total_events },
  ] : [];

  const pieData = analytics ? [
    { name: 'Resolved', value: analytics.total_complaints - analytics.pending_complaints },
    { name: 'Pending', value: analytics.pending_complaints },
  ] : [];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-dashboard">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-0">
            <Shield className="h-3 w-3 mr-1" /> Administrator
          </Badge>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit'] mb-2">
            Admin Control Center
          </h1>
          <p className="text-white/80 max-w-lg">
            Manage the entire UNIFY platform. Monitor activities, handle complaints, and keep the campus connected.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{analytics?.total_students || 0}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{analytics?.total_mentors || 0}</p>
              <p className="text-xs text-muted-foreground">Total Mentors</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{analytics?.pending_complaints || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Complaints</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{analytics?.total_events || 0}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-['Outfit']">Platform Overview</CardTitle>
            <CardDescription>Quick stats at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Complaints Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-['Outfit']">Complaints Status</CardTitle>
            <CardDescription>Overview of complaint resolution</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-['Outfit']">Recent Complaints</CardTitle>
            <CardDescription>Latest complaints from students</CardDescription>
          </div>
          <Link to="/manage-complaints">
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complaints.slice(0, 4).map((complaint) => (
              <div
                key={complaint.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{complaint.student_name}</h4>
                  <p className="text-xs text-muted-foreground">{complaint.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {complaint.department} - {complaint.year} Year
                  </p>
                </div>
                <Badge 
                  variant={complaint.status === 'resolved' ? 'default' : 'outline'}
                  className={complaint.status === 'pending' ? 'text-orange-500 border-orange-500' : ''}
                >
                  {complaint.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Link to="/manage-users">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Manage Users</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/assign-project">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Assign Project</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/manage-notices">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Post Notice</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/manage-events">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Manage Events</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/analytics">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">View Analytics</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
