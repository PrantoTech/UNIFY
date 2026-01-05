import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Bell, AlertTriangle, Info, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await axios.get(`${API}/notices`);
      setNotices(response.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return { icon: AlertTriangle, color: 'bg-red-500', badge: 'destructive' };
      case 'high':
        return { icon: Bell, color: 'bg-orange-500', badge: 'default' };
      case 'normal':
        return { icon: Info, color: 'bg-blue-500', badge: 'secondary' };
      default:
        return { icon: CheckCircle, color: 'bg-green-500', badge: 'outline' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6" data-testid="notices-page">
      <div>
        <h1 className="text-2xl font-bold font-['Outfit']">Notice Board</h1>
        <p className="text-muted-foreground">Important announcements from administration</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notices.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notices yet</h3>
            <p className="text-muted-foreground">Check back later for updates!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const config = getPriorityConfig(notice.priority);
            const Icon = config.icon;
            return (
              <Card key={notice.id} className="glass-card" data-testid={`notice-${notice.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl ${config.color} text-white flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-lg font-['Outfit']">{notice.title}</h3>
                        <Badge variant={config.badge} className="capitalize flex-shrink-0">
                          {notice.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span>Posted by {notice.author_name}</span>
                        <span>•</span>
                        <span>{formatDate(notice.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notices;
