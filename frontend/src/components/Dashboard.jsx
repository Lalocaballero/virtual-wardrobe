import React, { useState, useEffect } from 'react';
import { 
  SunIcon, MoonIcon, CloudIcon, UserIcon, SparklesIcon,
  ChartBarIcon, CubeIcon, BeakerIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';
import { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import OutfitGenerator from './OutfitGenerator';
import WardrobeManager from './WardrobeManager';
import OutfitHistory from './OutfitHistory';
import LaundryDashboard from './LaundryDashboard';
import SmartCollections from './SmartCollections';
import UsageAnalytics from './UsageAnalytics';
import UserProfile from './UserProfile';

const Dashboard = () => {
  // --- State and Hooks ---
  const [activeTab, setActiveTab] = useState('outfit');
  const [mood, setMood] = useState('casual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Destructure all needed state and actions from the store
  const { 
    user, // Get the basic user object for email display
    profile, // Get the full profile for the profile image
    fetchProfile, // Action to fetch the profile
    currentOutfit, 
    generateOutfit, 
    loading, 
    logout,
    laundryAlerts,
    usageAnalytics 
  } = useWardrobeStore();

  // --- CRITICAL FIX: Fetch profile data as soon as the user is logged in ---
  useEffect(() => {
    // If we have a user but no profile data yet, fetch it.
    if (user && !profile) {
      fetchProfile();
    }
  }, [user, profile, fetchProfile]); // This hook runs when the user logs in

  // --- Helper Functions ---
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
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
    { id: 'outfit', label: "Today's Outfit", shortLabel: 'Outfit', icon: SunIcon },
    { id: 'wardrobe', label: 'My Wardrobe', shortLabel: 'Wardrobe', icon: UserIcon },
    { id: 'collections', label: 'Smart Collections', shortLabel: 'Collections', icon: CubeIcon, badge: 'AI' },
    { id: 'analytics', label: 'Usage Analytics', shortLabel: 'Analytics', icon: ChartBarIcon, badge: 'NEW' },
    { id: 'laundry', label: 'Laundry Assistant', shortLabel: 'Laundry', icon: SparklesIcon, badge: getUrgentItemsCount(laundryAlerts) },
    { id: 'history', label: 'Outfit History', shortLabel: 'History', icon: CloudIcon }
  ];

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        // Define default options
        className: '',
        duration: 5000,
        style: {
          background: '#ffffff',
          color: '#374151',
        },
        // Default options for specific types
        success: {
          duration: 3000,
          theme: {
            primary: 'green',
            secondary: 'black',
          },
        },
         // Style for dark mode
        dark: {
          style: {
            background: '#1f2937', // gray-800
            color: '#ffffff',
          }
        }
      }}
    />
      {/* --- Header --- */}
      <header className="bg-white dark:bg-gray-800/50 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1.5 md:p-2 rounded-lg">
                <BeakerIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold">WeWear</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">AI-Powered Style Intelligence</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6 text-yellow-500" />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden">
                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>

              <div className="relative">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  {/* --- CORRECTED LOGIC: Use `profile` object for the image --- */}
                  {profile && profile.profile_image_url ? (
                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-6 w-6" />
                  )}
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 animate-fadeIn" onMouseLeave={() => setProfileMenuOpen(false)}>
                    <div className="px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold">Signed in as</p>
                      <p className="truncate">{user?.email}</p>
                    </div>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('profile'); setProfileMenuOpen(false); }} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</a>
                    {user?.is_admin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Admin</Link>
                    )}
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); setProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">Logout</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2">
              <div className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-indigo-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.badge && <span className={getBadgeStyle(tab.badge)}>{tab.badge}</span>}
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg font-medium">
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
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.badge && <span className={getBadgeStyle(tab.badge)}>{tab.badge}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* --- Mobile Bottom Navigation --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-1 z-30">
        <div className="flex justify-around">
          {tabs.slice(0, 5).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.badge && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">{tab.badge === 'AI' || tab.badge === 'NEW' ? '●' : tab.badge}</span>}
              </div>
              <span className="text-xs mt-1 truncate w-full text-center">{tab.shortLabel || tab.label}</span>
            </button>
          ))}
          <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center py-2 px-1 text-gray-500 dark:text-gray-400 min-w-0">
            <Bars3Icon className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>
      
      {/* --- Page-Specific Controls --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {activeTab === 'outfit' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-full sm:w-auto">
              <label htmlFor="mood-select" className="sr-only">Select your mood</label>
              <select
                id="mood-select"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full" // The base input styles from index.css will apply
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
              // Here we use a special gradient button that doesn't fit our standard .btn classes
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          {activeTab === 'outfit' && <div className="animate-fadeIn"><OutfitGenerator outfit={currentOutfit} mood={mood} /></div>}
          {activeTab === 'wardrobe' && <div className="animate-fadeIn"><WardrobeManager /></div>}
          {activeTab === 'collections' && <div className="animate-fadeIn"><SmartCollections /></div>}
          {activeTab === 'analytics' && <div className="animate-fadeIn"><UsageAnalytics /></div>}
          {activeTab === 'laundry' && <div className="animate-fadeIn"><LaundryDashboard /></div>}
          {activeTab === 'profile' && <div className="animate-fadeIn"><UserProfile /></div>}
          {activeTab === 'history' && <div className="animate-fadeIn"><OutfitHistory /></div>}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;