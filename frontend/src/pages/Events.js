import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Calendar, MapPin, Clock, Users, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', date: '', time: '', venue: '', image_url: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      const response = await axios.post(`${API}/events/${eventId}/register`);
      toast.success(response.data.message);
      setEvents(events.map(e => {
        if (e.id === eventId) {
          const registrations = [...(e.registrations || [])];
          if (response.data.action === 'registered') {
            registrations.push(user.id);
          } else {
            const idx = registrations.indexOf(user.id);
            if (idx > -1) registrations.splice(idx, 1);
          }
          return { ...e, registrations };
        }
        return e;
      }));
    } catch (error) {
      toast.error('Failed to register');
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Please fill required fields');
      return;
    }
    setCreating(true);
    try {
      const response = await axios.post(`${API}/events`, newEvent);
      setEvents([response.data, ...events]);
      setShowCreateDialog(false);
      setNewEvent({ title: '', description: '', date: '', time: '', venue: '', image_url: '' });
      toast.success('Event created!');
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const isRegistered = (event) => event.registrations?.includes(user?.id);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getUpcomingStatus = (dateStr) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Past', color: 'secondary' };
    if (diffDays === 0) return { label: 'Today!', color: 'destructive' };
    if (diffDays <= 3) return { label: `In ${diffDays} days`, color: 'default' };
    return { label: `${diffDays} days left`, color: 'outline' };
  };

  return (
    <div className="space-y-6" data-testid="events-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit']">Campus Events</h1>
          <p className="text-muted-foreground">Discover and register for upcoming events</p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="create-event-btn">
                <Plus className="h-4 w-4 mr-2" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Event Title *</Label>
                  <Input
                    placeholder="Enter event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Event description..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      placeholder="e.g., 10:00 AM"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input
                    placeholder="Event venue"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateEvent} className="w-full rounded-full" disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
            <p className="text-muted-foreground">Check back later for upcoming events!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map((event) => {
            const status = getUpcomingStatus(event.date);
            return (
              <Card key={event.id} className="glass-card overflow-hidden" data-testid={`event-${event.id}`}>
                <div className="h-32 bg-gradient-to-br from-accent to-primary relative">
                  {event.image_url && (
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                  )}
                  <Badge className={`absolute top-3 right-3`} variant={status.color}>
                    {status.label}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg font-['Outfit'] mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(event.date)}
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {event.time}
                      </div>
                    )}
                    {event.venue && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {event.venue}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {event.registrations?.length || 0} registered
                    </Badge>
                    <Button
                      variant={isRegistered(event) ? 'outline' : 'default'}
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleRegister(event.id)}
                      data-testid={`register-event-${event.id}`}
                    >
                      {isRegistered(event) ? 'Registered ✓' : 'Register'}
                    </Button>
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

export default Events;
