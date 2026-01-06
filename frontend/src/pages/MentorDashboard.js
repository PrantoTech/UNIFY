import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  Users, Calendar, MessageSquare, FileText, ChevronRight, Clock, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MentorDashboard = () => {
  const { user } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [menteesRes, appointmentsRes] = await Promise.all([
        axios.get(`${API}/mentor/mentees`),
        axios.get(`${API}/appointments`),
      ]);
      setMentees(menteesRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      await axios.put(`${API}/appointments/${id}/status?status=${status}`);
      toast.success(`Appointment ${status}`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to update appointment');
    }
  };

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const todayAppointments = appointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.date === today && a.status === 'approved';
  });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="mentor-dashboard">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-teal-500 p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-0">
            Mentor
          </Badge>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit'] mb-2">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-white/80 max-w-lg">
            Guide and inspire your mentees. Your wisdom shapes their future.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {mentees.length} Mentees
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {todayAppointments.length} Today's Meetings
            </span>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{mentees.length}</p>
              <p className="text-xs text-muted-foreground">Total Mentees</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{pendingAppointments.length}</p>
              <p className="text-xs text-muted-foreground">Pending Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{todayAppointments.length}</p>
              <p className="text-xs text-muted-foreground">Today's Meetings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">5</p>
              <p className="text-xs text-muted-foreground">Notes Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Mentees */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-['Outfit']">My Mentees</CardTitle>
              <CardDescription>Students under your guidance</CardDescription>
            </div>
            <Link to="/mentees">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {mentees.length === 0 ? (
              <p className="text-muted-foreground text-sm">No mentees assigned yet</p>
            ) : (
              mentees.slice(0, 4).map((mentee) => (
                <div
                  key={mentee.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {mentee.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{mentee.name}</h4>
                    <p className="text-xs text-muted-foreground">{mentee.department}</p>
                  </div>
                  <Badge variant="outline">{mentee.year}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Appointments */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-['Outfit']">Pending Requests</CardTitle>
              <CardDescription>Appointment requests from students</CardDescription>
            </div>
            <Link to="/appointments">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending requests</p>
            ) : (
              pendingAppointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{apt.student_name}</h4>
                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                      Pending
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {apt.date} at {apt.time_slot}
                  </p>
                  {apt.reason && (
                    <p className="text-xs text-muted-foreground mb-3">{apt.reason}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateAppointmentStatus(apt.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => updateAppointmentStatus(apt.id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Link to="/mentees">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">View Mentees</span>
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
        <Link to="/appointments">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Appointments</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/mentor-notes">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">My Notes</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/chat">
          <Card className="glass-card hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Messages</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default MentorDashboard;
