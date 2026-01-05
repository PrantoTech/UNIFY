import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  Users, Calendar, MessageSquare, BookOpen, Bell, UtensilsCrossed, 
  Bus, FileText, Clock, ChevronRight, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [noticesRes, eventsRes] = await Promise.all([
        axios.get(`${API}/notices`),
        axios.get(`${API}/events`),
      ]);
      setNotices(noticesRes.data.slice(0, 3));
      setEvents(eventsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { icon: MessageSquare, label: 'Campus Connect', path: '/campus-connect', color: 'bg-blue-500' },
    { icon: Users, label: 'Clubs', path: '/clubs', color: 'bg-purple-500' },
    { icon: BookOpen, label: 'Mentoring', path: '/mentoring', color: 'bg-green-500' },
    { icon: Calendar, label: 'Events', path: '/events', color: 'bg-orange-500' },
    { icon: UtensilsCrossed, label: 'Canteen', path: '/canteen', color: 'bg-red-500' },
    { icon: Bus, label: 'Transport', path: '/transport', color: 'bg-cyan-500' },
    { icon: BookOpen, label: 'Library', path: '/library', color: 'bg-indigo-500' },
    { icon: FileText, label: 'Notices', path: '/notices', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="student-dashboard">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-0">
            {user?.department}
          </Badge>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Outfit'] mb-2">
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-white/80 max-w-lg">
            Welcome to your campus dashboard. Stay connected with your peers, mentors, and campus activities.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                {user?.registration_no}
              </Badge>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {user?.year} Year
            </span>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold font-['Outfit'] mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl glass-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                data-testid={`quick-link-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                <div className={`p-3 rounded-xl ${link.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Notices */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-['Outfit']">Recent Notices</CardTitle>
              <CardDescription>Latest announcements from admin</CardDescription>
            </div>
            <Link to="/notices">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No notices yet</p>
            ) : (
              notices.map((notice) => (
                <div
                  key={notice.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    notice.priority === 'urgent' ? 'bg-destructive' :
                    notice.priority === 'high' ? 'bg-orange-500' : 'bg-primary'
                  } text-white`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{notice.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notice.content}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-['Outfit']">Upcoming Events</CardTitle>
              <CardDescription>Don't miss out on campus events</CardDescription>
            </div>
            <Link to="/events">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming events</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-accent text-accent-foreground min-w-[50px]">
                    <span className="text-lg font-bold">{new Date(event.date).getDate()}</span>
                    <span className="text-xs">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">{event.venue || 'TBA'}</p>
                    <p className="text-xs text-muted-foreground">{event.time || 'Time TBA'}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">12</p>
              <p className="text-xs text-muted-foreground">New Messages</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">{events.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">3</p>
              <p className="text-xs text-muted-foreground">Clubs Joined</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold font-['Outfit']">2</p>
              <p className="text-xs text-muted-foreground">Books Borrowed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
