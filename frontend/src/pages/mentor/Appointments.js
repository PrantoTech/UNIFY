import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { toast } from 'sonner';
import { Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentId, status) => {
    try {
      await axios.put(`${API}/appointments/${appointmentId}/status?status=${status}`);
      setAppointments(appointments.map(a => a.id === appointmentId ? { ...a, status } : a));
      toast.success(`Appointment ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
    }
  };

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const upcomingAppointments = appointments.filter(a => a.status === 'approved');
  const pastAppointments = appointments.filter(a => ['rejected', 'completed'].includes(a.status));

  return (
    <div className="space-y-6" data-testid="appointments-page">
      <div>
        <h1 className="text-2xl font-bold font-['Outfit']">Appointments</h1>
        <p className="text-muted-foreground">Manage your meeting requests</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Requests */}
          {pendingAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold font-['Outfit'] mb-4">Pending Requests</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {pendingAppointments.map((apt) => (
                  <Card key={apt.id} className="glass-card border-orange-500/20" data-testid={`pending-apt-${apt.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar>
                          <AvatarFallback className="bg-orange-500/10 text-orange-500">
                            {apt.student_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{apt.student_name}</h3>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {apt.date}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {apt.time_slot}
                        </div>
                        {apt.reason && <p className="text-sm">{apt.reason}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 rounded-full"
                          onClick={() => updateStatus(apt.id, 'approved')}
                          data-testid={`approve-apt-${apt.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-full"
                          onClick={() => updateStatus(apt.id, 'rejected')}
                          data-testid={`reject-apt-${apt.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold font-['Outfit'] mb-4">Upcoming Meetings</h2>
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <Card key={apt.id} className="glass-card" data-testid={`upcoming-apt-${apt.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-green-500/10 text-green-500">
                              {apt.student_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{apt.student_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {apt.date} at {apt.time_slot}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(apt.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => updateStatus(apt.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold font-['Outfit'] mb-4">Past Appointments</h2>
              <div className="space-y-3">
                {pastAppointments.map((apt) => (
                  <Card key={apt.id} className="glass-card opacity-75" data-testid={`past-apt-${apt.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="opacity-50">
                            <AvatarFallback className="bg-secondary">
                              {apt.student_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{apt.student_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {apt.date} at {apt.time_slot}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No appointments</h3>
                <p className="text-muted-foreground">You don't have any appointments yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Appointments;
