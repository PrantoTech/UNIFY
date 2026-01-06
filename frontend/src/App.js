import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './pages/StudentDashboard';
import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';

import CampusConnect from './pages/CampusConnect';
import Clubs from './pages/Clubs';
import Chat from './pages/Chat';
import Mentoring from './pages/Mentoring';
import Events from './pages/Events';
import Notices from './pages/Notices';
import Library from './pages/Library';
import Transport from './pages/Transport';
import Canteen from './pages/Canteen';
import LostFound from './pages/LostFound';
import Complaints from './pages/Complaints';
import Feedback from './pages/Feedback';

import ManageUsers from './pages/admin/ManageUsers';
import ManageNotices from './pages/admin/ManageNotices';
import ManageComplaints from './pages/admin/ManageComplaints';
import ViewFeedback from './pages/admin/ViewFeedback';

import MentorNotes from './pages/mentor/MentorNotes';
import Appointments from './pages/mentor/Appointments';
import Mentees from './pages/mentor/Mentees';

import Analytics from './pages/Analytics';
import AssignProject from './pages/AssignProject';

import './App.css';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'mentor':
        return <Navigate to="/mentor-dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      case 'mentor':
        return <Navigate to="/mentor-dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* Student Dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      {/* Mentor Dashboard */}
      <Route path="/mentor-dashboard" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorDashboard />
        </ProtectedRoute>
      } />

      {/* Admin Dashboard */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Common Routes (all authenticated users) */}
      <Route path="/campus-connect" element={
        <ProtectedRoute>
          <CampusConnect />
        </ProtectedRoute>
      } />
      <Route path="/clubs" element={
        <ProtectedRoute>
          <Clubs />
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />
      <Route path="/events" element={
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      } />
      <Route path="/notices" element={
        <ProtectedRoute>
          <Notices />
        </ProtectedRoute>
      } />
      <Route path="/library" element={
        <ProtectedRoute>
          <Library />
        </ProtectedRoute>
      } />
      <Route path="/transport" element={
        <ProtectedRoute>
          <Transport />
        </ProtectedRoute>
      } />
      <Route path="/canteen" element={
        <ProtectedRoute>
          <Canteen />
        </ProtectedRoute>
      } />
      <Route path="/lost-found" element={
        <ProtectedRoute>
          <LostFound />
        </ProtectedRoute>
      } />
      <Route path="/complaints" element={
        <ProtectedRoute>
          <Complaints />
        </ProtectedRoute>
      } />
      <Route path="/feedback" element={
        <ProtectedRoute>
          <Feedback />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/mentoring" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Mentoring />
        </ProtectedRoute>
      } />

      {/* Analytics Route (Mentor & Admin) */}
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <Analytics />
        </ProtectedRoute>
      } />

      {/* Project Assignment Route (Mentor & Admin) */}
      <Route path="/assign-project" element={
        <ProtectedRoute allowedRoles={['mentor', 'admin']}>
          <AssignProject />
        </ProtectedRoute>
      } />

      {/* Mentor Routes */}
      <Route path="/mentees" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <Mentees />
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <Appointments />
        </ProtectedRoute>
      } />
      <Route path="/mentor-notes" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorNotes />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/manage-users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageUsers />
        </ProtectedRoute>
      } />
      <Route path="/manage-notices" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageNotices />
        </ProtectedRoute>
      } />
      <Route path="/manage-events" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Events />
        </ProtectedRoute>
      } />
      <Route path="/manage-complaints" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageComplaints />
        </ProtectedRoute>
      } />
      <Route path="/view-feedback" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ViewFeedback />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/canteen-orders" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Canteen />
        </ProtectedRoute>
      } />
      <Route path="/transport-bookings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Transport />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
