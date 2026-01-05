import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Bell, Plus, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ManageNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    priority: 'normal'
  });
  const [creating, setCreating] = useState(false);

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

  const handleCreateNotice = async () => {
    if (!newNotice.title || !newNotice.content) {
      toast.error('Please fill all fields');
      return;
    }
    setCreating(true);
    try {
      const response = await axios.post(`${API}/notices`, newNotice);
      setNotices([response.data, ...notices]);
      setShowCreateDialog(false);
      setNewNotice({ title: '', content: '', priority: 'normal' });
      toast.success('Notice posted successfully!');
    } catch (error) {
      toast.error('Failed to create notice');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      await axios.delete(`${API}/notices/${noticeId}`);
      setNotices(notices.filter(n => n.id !== noticeId));
      toast.success('Notice deleted');
    } catch (error) {
      toast.error('Failed to delete notice');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="manage-notices-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Manage Notices</h1>
          <p className="text-muted-foreground">Post and manage campus announcements</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="post-notice-btn">
              <Plus className="h-4 w-4 mr-2" /> Post Notice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post New Notice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="Notice title"
                  data-testid="notice-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Notice content..."
                  rows={4}
                  data-testid="notice-content"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newNotice.priority} onValueChange={(v) => setNewNotice({ ...newNotice, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateNotice} className="w-full rounded-full" disabled={creating} data-testid="submit-notice">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Post Notice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            <p className="text-muted-foreground">Post your first notice to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="glass-card" data-testid={`notice-card-${notice.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{notice.title}</h3>
                        {getPriorityBadge(notice.priority)}
                      </div>
                      <p className="text-muted-foreground text-sm">{notice.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Posted by {notice.author_name} • {new Date(notice.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteNotice(notice.id)}
                    data-testid={`delete-notice-${notice.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageNotices;
