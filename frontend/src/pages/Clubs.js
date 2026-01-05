import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Users, Plus, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Clubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClub, setNewClub] = useState({ name: '', description: '', image_url: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await axios.get(`${API}/clubs`);
      setClubs(response.data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async () => {
    if (!newClub.name.trim() || !newClub.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      const response = await axios.post(`${API}/clubs`, newClub);
      setClubs([response.data, ...clubs]);
      setNewClub({ name: '', description: '', image_url: '' });
      setShowCreateDialog(false);
      toast.success('Club created successfully!');
    } catch (error) {
      toast.error('Failed to create club');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLeave = async (clubId) => {
    try {
      const response = await axios.post(`${API}/clubs/${clubId}/join`);
      setClubs(clubs.map(club => {
        if (club.id === clubId) {
          const members = [...(club.members || [])];
          if (response.data.action === 'joined') {
            members.push(user.id);
          } else {
            const idx = members.indexOf(user.id);
            if (idx > -1) members.splice(idx, 1);
          }
          return { ...club, members };
        }
        return club;
      }));
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update membership');
    }
  };

  const isMember = (club) => club.members?.includes(user?.id);

  const clubColors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ];

  return (
    <div className="space-y-6" data-testid="clubs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Campus Clubs</h1>
          <p className="text-muted-foreground">Join clubs and connect with like-minded peers</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="create-club-btn">
              <Plus className="h-4 w-4 mr-2" /> Create Club
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="club-name">Club Name</Label>
                <Input
                  id="club-name"
                  placeholder="Enter club name"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  data-testid="club-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-description">Description</Label>
                <Textarea
                  id="club-description"
                  placeholder="Describe your club..."
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  data-testid="club-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club-image">Image URL (optional)</Label>
                <Input
                  id="club-image"
                  placeholder="Paste image URL"
                  value={newClub.image_url}
                  onChange={(e) => setNewClub({ ...newClub, image_url: e.target.value })}
                />
              </div>
              <Button 
                onClick={handleCreateClub} 
                className="w-full rounded-full"
                disabled={creating}
                data-testid="submit-club-btn"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Club
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : clubs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No clubs yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a club!</p>
            <Button onClick={() => setShowCreateDialog(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" /> Create Club
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club, index) => (
            <Card key={club.id} className="glass-card overflow-hidden" data-testid={`club-${club.id}`}>
              <div className={`h-24 bg-gradient-to-br ${clubColors[index % clubColors.length]}`}>
                {club.image_url && (
                  <img src={club.image_url} alt={club.name} className="w-full h-full object-cover" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold font-['Outfit']">{club.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{club.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {club.members?.length || 0} members
                  </Badge>
                  <Button
                    size="sm"
                    variant={isMember(club) ? 'outline' : 'default'}
                    className="rounded-full"
                    onClick={() => handleJoinLeave(club.id)}
                    data-testid={`join-club-${club.id}`}
                  >
                    {isMember(club) ? (
                      <>
                        <UserMinus className="h-4 w-4 mr-1" /> Leave
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" /> Join
                      </>
                    )}
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

export default Clubs;
