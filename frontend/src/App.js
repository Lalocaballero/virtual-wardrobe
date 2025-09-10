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
import PackingAssistant from './components/PackingAssistant';
import UsageAnalytics from './components/UsageAnalytics';
import LaundryDashboard from './components/LaundryDashboard';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookieBanner from './components/CookieBanner';
import UpgradeModal from './components/UpgradeModal';
import WelcomePremium from './components/WelcomePremium';

function App() {
  const { user, initUser, isImpersonating } = useWardrobeStore();

  useEffect(() => {
    initUser();
  }, [initUser]);

  const isAdmin = user && user.is_admin && !isImpersonating;

  return (
    <Router>
      <ImpersonationBanner />
      <CookieBanner />
      <UpgradeModal />
      <div className={isImpersonating ? 'pt-10' : ''}>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/admin/*" element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />

          {/* Temporary Verification Routes */}
          <Route path="/verify-packing-assistant" element={<PackingAssistant />} />
          <Route path="/verify-analytics" element={<UsageAnalytics />} />
          <Route path="/verify-laundry" element={<LaundryDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;