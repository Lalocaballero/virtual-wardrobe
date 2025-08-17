import React, { useState, useEffect } from 'react';
import { 
  SunIcon, MoonIcon, CloudIcon, UserIcon, SparklesIcon,
  ChartBarIcon, CubeIcon, BeakerIcon, Bars3Icon, XMarkIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Toaster } from 'react-hot-toast';
import { Link, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import OutfitGenerator from './OutfitGenerator';
import WardrobeManager from './WardrobeManager';
import OutfitHistory from './OutfitHistory';
import LaundryDashboard from './LaundryDashboard';
import SmartCollections from './SmartCollections';
import UsageAnalytics from './UsageAnalytics';
import UserProfile from './UserProfile';
import PackingAssistant from './PackingAssistant';
import NotificationBell from './NotificationBell';

const Dashboard = () => {
  // --- State and Hooks ---
  const [mood, setMood] = useState('casual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();

  const {
    user,
    profile,
    fetchProfile,
    currentOutfit,
    generateOutfit,
    loading,
    logout,
    laundryAlerts,
    setTheme,
    theme
  } = useWardrobeStore();

  const currentTab = location.pathname.split('/')[2] || 'outfit';

  // --- CRITICAL FIX: Fetch profile data as soon as the user is logged in ---
  useEffect(() => {
    // If we have a user but no profile data yet, fetch it.
    if (user && !profile) {
      fetchProfile();
    }
  }, [user, profile, fetchProfile]); // This hook runs when the user logs in

  // --- Helper Functions ---
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme); 
    // This part is now handled in the store, but we might need to adjust based on how you set up your theme switching
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleGenerateOutfit = () => generateOutfit(mood);
  const handleLogout = () => logout();

  function getUrgentItemsCount(alerts) {
    if (!alerts) return null;
    const urgentCount = (alerts.urgent_items?.length || 0) + (alerts.high_priority?.length || 0);
    return urgentCount > 0 ? urgentCount.toString() : null;
  }
  
  const getBadgeStyle = (badge) => {
    // ... no changes needed here, your function is perfect
    if (!badge) return '';
    if (badge === 'AI') return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full';
    if (badge === 'NEW') return 'bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full';
    if (parseInt(badge) > 0) return 'bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center';
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs px-1.5 py-0.5 rounded-full';
  };

  // --- Data Definitions ---
  const moodOptions = [
    { value: 'casual', label: 'Casual', emoji: '😌' },
    { value: 'professional', label: 'Professional', emoji: '👔' },
    { value: 'sporty', label: 'Sporty', emoji: '🏃‍♂️' },
    { value: 'cozy', label: 'Cozy', emoji: '🏠' },
    { value: 'date', label: 'Date Night', emoji: '💕' },
    { value: 'party', label: 'Party', emoji: '🎉' }
  ];

  const tabs = [
    { id: 'outfit', path: 'outfit', label: "Today's Outfit", shortLabel: 'Outfit', icon: SunIcon },
    { id: 'wardrobe', path: 'wardrobe', label: 'My Wardrobe', shortLabel: 'Wardrobe', icon: UserIcon },
    { id: 'packing', path: 'packing', label: 'Packing Assistant', shortLabel: 'Packing', icon: BriefcaseIcon },
    { id: 'collections', path: 'collections', label: 'Smart Collections', shortLabel: 'Collections', icon: CubeIcon },
    { id: 'analytics', path: 'analytics', label: 'Usage Analytics', shortLabel: 'Analytics', icon: ChartBarIcon },
    { id: 'laundry', path: 'laundry', label: 'Laundry Assistant', shortLabel: 'Laundry', icon: SparklesIcon, badge: getUrgentItemsCount(laundryAlerts) },
    { id: 'history', path: 'history', label: 'Outfit History', shortLabel: 'History', icon: CloudIcon },
    { id: 'profile', path: 'profile', label: 'My Profile', shortLabel: 'Profile', icon: UserIcon, isProfile: true },
  ];

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        // Define default options
        className: '',
        duration: 5000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        },
        // Default options for specific types
        success: {
          duration: 3000,
        },
      }}
    />
      {/* --- Header --- */}
      <header className="bg-card/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-primary p-1.5 md:p-2 rounded-lg">
                <BeakerIcon className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold">WeWear</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Style Intelligence</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <NotificationBell />
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted">
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6 text-yellow-500" />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-muted md:hidden">
                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>

              <div className="relative">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="w-9 h-9 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {profile && profile.profile_image_url ? (
                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-6 w-6" />
                  )}
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg py-1 border animate-fadeIn" onMouseLeave={() => setProfileMenuOpen(false)}>
                    <div className="px-4 py-2 text-sm border-b">
                      <p className="font-semibold">Signed in as</p>
                      <p className="truncate text-muted-foreground">{user?.email}</p>
                    </div>
                    <NavLink to="profile" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-muted">My Profile</NavLink>
                    {user?.is_admin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-muted">Admin</Link>
                    )}
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); setProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Logout</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-2">
              <div className="space-y-1">
                {tabs.map(tab => !tab.isProfile && (
                  <NavLink
                    key={tab.id}
                    to={tab.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-muted'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.badge && <span className={getBadgeStyle(tab.badge)}>{tab.badge}</span>}
                  </NavLink>
                ))}
                <div className="border-t pt-2 mt-2">
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg font-medium">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* --- Desktop Tab Navigation --- */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b">
          <nav className="-mb-px flex space-x-1 overflow-x-auto">
            {tabs.map(tab => !tab.isProfile && (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={({ isActive }) =>
                  `py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`
                }
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.badge && <span className={getBadgeStyle(tab.badge)}>{tab.badge}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      
      {/* --- Mobile Bottom Navigation --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t px-2 py-1 z-30">
        <div className="flex justify-around">
          {tabs.slice(0, 5).map(tab => !tab.isProfile && (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`
              }
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.badge && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">{tab.badge === 'AI' || tab.badge === 'NEW' ? '●' : tab.badge}</span>}
              </div>
              <span className="text-xs mt-1 truncate w-full text-center">{tab.shortLabel || tab.label}</span>
            </NavLink>
          ))}
          <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center py-2 px-1 text-muted-foreground min-w-0">
            <Bars3Icon className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>
      
      {/* --- Page-Specific Controls --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {currentTab === 'outfit' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg shadow-sm border">
            <div className="w-full sm:w-auto">
              <label htmlFor="mood-select" className="sr-only">Select your mood</label>
              <select
                id="mood-select"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-input"
              >
                {moodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateOutfit}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2 rounded-lg font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <span>{loading ? 'Generating...' : 'Generate Outfit'}</span>
            </button>
          </div>
        )}
      </div>
      
      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="transition-all duration-300 ease-in-out">
          <Routes>
            <Route index element={<Navigate to="outfit" replace />} />
            <Route path="outfit" element={<div className="animate-fadeIn"><OutfitGenerator outfit={currentOutfit} mood={mood} /></div>} />
            <Route path="wardrobe" element={<div className="animate-fadeIn"><WardrobeManager /></div>} />
            <Route path="collections" element={<div className="animate-fadeIn"><SmartCollections /></div>} />
            <Route path="analytics" element={<div className="animate-fadeIn"><UsageAnalytics /></div>} />
            <Route path="laundry" element={<div className="animate-fadeIn"><LaundryDashboard /></div>} />
            <Route path="profile" element={<div className="animate-fadeIn"><UserProfile /></div>} />
            <Route path="history" element={<div className="animate-fadeIn"><OutfitHistory /></div>} />
            <Route path="packing" element={<div className="animate-fadeIn"><PackingAssistant /></div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;