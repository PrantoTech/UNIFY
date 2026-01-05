import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Plus, Lock, Eye, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MentorNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockedContent, setUnlockedContent] = useState(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    password: '',
    mentee_id: ''
  });
  const [creating, setCreating] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API}/mentor-notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.content || !newNote.password) {
      toast.error('Please fill all required fields');
      return;
    }
    setCreating(true);
    try {
      const response = await axios.post(`${API}/mentor-notes`, newNote);
      setNotes([response.data, ...notes]);
      setShowCreateDialog(false);
      setNewNote({ title: '', content: '', password: '', mentee_id: '' });
      toast.success('Note created successfully!');
    } catch (error) {
      toast.error('Failed to create note');
    } finally {
      setCreating(false);
    }
  };

  const handleUnlockNote = async () => {
    if (!unlockPassword) {
      toast.error('Please enter password');
      return;
    }
    setUnlocking(true);
    try {
      const response = await axios.post(
        `${API}/mentor-notes/${selectedNote.id}/unlock?password=${encodeURIComponent(unlockPassword)}`
      );
      setUnlockedContent(response.data);
      setUnlockPassword('');
    } catch (error) {
      toast.error('Invalid password');
    } finally {
      setUnlocking(false);
    }
  };

  const openUnlockDialog = (note) => {
    setSelectedNote(note);
    setUnlockedContent(null);
    setUnlockPassword('');
    setShowUnlockDialog(true);
  };

  return (
    <div className="space-y-6" data-testid="mentor-notes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Mentor Notes</h1>
          <p className="text-muted-foreground">Create password-protected notes for mentees</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="create-note-btn">
              <Plus className="h-4 w-4 mr-2" /> Create Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Protected Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                  data-testid="note-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Note content..."
                  rows={6}
                  data-testid="note-content"
                />
              </div>
              <div className="space-y-2">
                <Label>Password * (for unlocking)</Label>
                <Input
                  type="password"
                  value={newNote.password}
                  onChange={(e) => setNewNote({ ...newNote, password: e.target.value })}
                  placeholder="Set a password"
                  data-testid="note-password"
                />
              </div>
              <Button onClick={handleCreateNote} className="w-full rounded-full" disabled={creating} data-testid="submit-note">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Create Protected Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notes.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">Create your first protected note</p>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" /> Create Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="glass-card" data-testid={`note-card-${note.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">{note.title}</h3>
                  </div>
                  <Badge variant="secondary">Protected</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Created on {new Date(note.created_at).toLocaleDateString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full"
                  onClick={() => openUnlockDialog(note)}
                  data-testid={`unlock-note-${note.id}`}
                >
                  <Eye className="h-4 w-4 mr-2" /> View Note
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unlock Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
          </DialogHeader>
          {unlockedContent ? (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-secondary/50 whitespace-pre-wrap">
                {unlockedContent.content}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground text-sm">
                This note is password protected. Enter the password to view.
              </p>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter password"
                  data-testid="unlock-password"
                />
              </div>
              <Button onClick={handleUnlockNote} className="w-full rounded-full" disabled={unlocking} data-testid="unlock-submit">
                {unlocking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Unlock Note
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorNotes;
