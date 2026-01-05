import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Bus, Phone, Clock, MapPin, Calendar, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Transport = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [bookingData, setBookingData] = useState({
    pickup_location: '',
    drop_location: '',
    date: '',
    time: ''
  });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [driversRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/transport/drivers`),
        axios.get(`${API}/transport/bookings`),
      ]);
      setDrivers(driversRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookToto = async () => {
    if (!bookingData.pickup_location || !bookingData.drop_location || !bookingData.date || !bookingData.time) {
      toast.error('Please fill all fields');
      return;
    }
    setBooking(true);
    try {
      await axios.post(`${API}/transport/bookings`, {
        driver_id: selectedDriver.id,
        ...bookingData
      });
      toast.success('Booking confirmed!');
      setShowBookingDialog(false);
      setBookingData({ pickup_location: '', drop_location: '', date: '', time: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to book');
    } finally {
      setBooking(false);
    }
  };

  const campusLocations = [
    'Main Gate',
    'Admin Block',
    'Academic Block A',
    'Academic Block B',
    'Library',
    'Canteen',
    'Hostel Block 1',
    'Hostel Block 2',
    'Sports Complex',
    'Parking Area'
  ];

  return (
    <div className="space-y-6" data-testid="transport-page">
      <div>
        <h1 className="text-2xl font-bold font-['Outfit']">Transport Services</h1>
        <p className="text-muted-foreground">Book campus toto for convenient travel</p>
      </div>

      {/* Toto Timetable */}
      <Card className="glass-card bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500 text-white">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Toto Service Timings</h3>
              <p className="text-sm text-muted-foreground">
                9:30 AM - 6:10 PM (Monday to Saturday)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Drivers */}
      <div>
        <h2 className="text-lg font-semibold font-['Outfit'] mb-4">Available Drivers</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => (
              <Card key={driver.id} className="glass-card" data-testid={`driver-${driver.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-cyan-500/10 text-cyan-600">
                        {driver.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{driver.name}</h3>
                      <p className="text-sm text-muted-foreground">{driver.vehicle_no}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {driver.phone}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {driver.timing}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={driver.available ? 'default' : 'secondary'}>
                      {driver.available ? 'Available' : 'Busy'}
                    </Badge>
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={!driver.available}
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowBookingDialog(true);
                      }}
                      data-testid={`book-driver-${driver.id}`}
                    >
                      <Bus className="h-4 w-4 mr-2" /> Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My Bookings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-['Outfit']">My Bookings</CardTitle>
          <CardDescription>Your toto booking history</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Bus className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {booking.pickup_location} → {booking.drop_location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Toto - {selectedDriver?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <Select
                value={bookingData.pickup_location}
                onValueChange={(v) => setBookingData({ ...bookingData, pickup_location: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup point" />
                </SelectTrigger>
                <SelectContent>
                  {campusLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Drop Location</Label>
              <Select
                value={bookingData.drop_location}
                onValueChange={(v) => setBookingData({ ...bookingData, drop_location: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select drop point" />
                </SelectTrigger>
                <SelectContent>
                  {campusLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleBookToto} className="w-full rounded-full" disabled={booking}>
              {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transport;
