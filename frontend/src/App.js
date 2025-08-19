import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useWardrobeStore from './store/wardrobeStore';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VerifyEmail from './components/VerifyEmail';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/Admin/AdminDashboard';
import ImpersonationBanner from './components/ImpersonationBanner';
import Onboarding from './components/Onboarding';
import ProtectedRoute from './components/ProtectedRoute';
import CheckEmail from './components/CheckEmail';

function App() {
  const { user, initUser, isImpersonating } = useWardrobeStore();

  useEffect(() => {
    initUser();
  }, [initUser]);

  const isAdmin = user && user.is_admin && !isImpersonating;

  return (
    <Router>
      <ImpersonationBanner />
      <div className={isImpersonating ? 'pt-10' : ''}>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/check-email" element={<CheckEmail />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          <Route path="/admin/*" element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;