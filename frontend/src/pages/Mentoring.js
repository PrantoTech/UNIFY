import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Calendar } from '../components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Users, Calendar as CalendarIcon, Clock, Star, MessageCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Mentoring = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [myMentor, setMyMentor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingDate, setBookingDate] = useState(null);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [booking, setBooking] = useState(false);

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mentorsRes, myMentorRes, appointmentsRes] = await Promise.all([
        axios.get(`${API}/mentors`),
        axios.get(`${API}/mentor/my-mentor`),
        axios.get(`${API}/appointments`),
      ]);
      setMentors(mentorsRes.data);
      setMyMentor(myMentorRes.data);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!bookingDate || !bookingTime) {
      toast.error('Please select date and time');
      return;
    }
    setBooking(true);
    try {
      await axios.post(`${API}/appointments`, {
        mentor_id: selectedMentor.id,
        date: bookingDate.toISOString().split('T')[0],
        time_slot: bookingTime,
        reason: bookingReason,
      });
      toast.success('Appointment request sent!');
      setShowBookingDialog(false);
      setBookingDate(null);
      setBookingTime('');
      setBookingReason('');
      fetchData();
    } catch (error) {
      toast.error('Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="mentoring-page">
      <div>
        <h1 className="text-2xl font-bold font-['Outfit']">Mentoring</h1>
        <p className="text-muted-foreground">Connect with mentors and book appointments</p>
      </div>

      {/* My Mentor */}
      {myMentor && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-['Outfit'] flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              My Mentor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {myMentor.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{myMentor.name}</h3>
                <p className="text-muted-foreground">{myMentor.department}</p>
                <p className="text-sm text-muted-foreground">{myMentor.mobile}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full">
                  <MessageCircle className="h-4 w-4 mr-2" /> Chat
                </Button>
                <Button 
                  className="rounded-full"
                  onClick={() => {
                    setSelectedMentor(myMentor);
                    setShowBookingDialog(true);
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" /> Book
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Appointments */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-['Outfit']">My Appointments</CardTitle>
          <CardDescription>Your scheduled meetings with mentors</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No appointments scheduled</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{apt.date}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {apt.time_slot}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Mentors */}
      <div>
        <h2 className="text-lg font-semibold font-['Outfit'] mb-4">Available Mentors</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="glass-card" data-testid={`mentor-${mentor.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-500/10 text-green-600">
                        {mentor.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground">{mentor.department}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 rounded-full"
                      onClick={() => {
                        setSelectedMentor(mentor);
                        setShowBookingDialog(true);
                      }}
                      data-testid={`book-mentor-${mentor.id}`}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" /> Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment with {selectedMentor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={bookingDate}
                onSelect={setBookingDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border mt-2"
              />
            </div>
            <div className="space-y-2">
              <Label>Select Time Slot</Label>
              <Select value={bookingTime} onValueChange={setBookingTime}>
                <SelectTrigger data-testid="time-slot-select">
                  <SelectValue placeholder="Choose a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Briefly describe the reason for meeting..."
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleBookAppointment} 
              className="w-full rounded-full"
              disabled={booking}
              data-testid="confirm-booking-btn"
            >
              {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mentoring;
