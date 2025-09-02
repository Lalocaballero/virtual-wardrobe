import React, { useState, useEffect, useCallback } from 'react';
import { 
  SunIcon, MoonIcon, CloudIcon, UserIcon, SparklesIcon,
  ChartBarIcon, CubeIcon, BeakerIcon, Bars3Icon, XMarkIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { STATUS } from 'react-joyride';
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
import AppTour from './AppTour';
import { tourSteps } from '../tourSteps';
import { API_BASE } from '../store/wardrobeStore';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = useCallback((pathname) => {
    const pathTab = pathname.split('/dashboard/')[1] || 'outfit';
    const preliminaryValidTabs = ['outfit', 'wardrobe', 'packing', 'collections', 'analytics', 'laundry', 'history', 'profile'];
    if (preliminaryValidTabs.includes(pathTab)) {
        return pathTab;
    }
    return 'outfit';
  }, []);

  // --- State and Hooks ---
  const [runTour, setRunTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
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
    laundryAlerts
    // fetchAppSettings was removed as it does not exist in the store
  } = useWardrobeStore();

  // Fetch profile data once when the user logs in.
  useEffect(() => {
    // If we have a user but no profile data yet, fetch it.
    if (user && !profile) {
      fetchProfile();
    }
    // We disable the lint rule because adding `profile` to the dependency array
    // would cause an infinite loop, as this effect itself fetches the profile.
    // This effect should only run when the user object is first available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchProfile]);

  // This effect synchronizes the activeTab state with the URL.
  // This is necessary for handling navigation from outside the tab buttons,
  // such as from notification clicks or browser back/forward actions.
  useEffect(() => {
    const newTab = getTabFromPath(location.pathname);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname, activeTab, getTabFromPath]);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('hasCompletedTour');
    if (!hasCompletedTour) {
      // Start the tour with a short delay to allow the page to render
      setTimeout(() => setRunTour(true), 1000);
    }
  }, []);

  // Establish Server-Sent Events (SSE) connection for notifications
  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE}/api/notifications/stream`, { withCredentials: true });

    eventSource.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
      console.log('New notification received via SSE:', newNotification);
      toast.info(newNotification.message || 'You have a new notification!');
      // Refetch all notifications to update the list and count
      useWardrobeStore.getState().fetchNotifications();
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      // The browser will automatically try to reconnect, but we can close it
      // if we want to stop. For now, we'll let it keep trying.
    };

    // Clean up the connection when the component unmounts
    return () => {
      eventSource.close();
    };
  }, []); // Empty dependency array ensures this runs only once.

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    navigate(`/dashboard/${tabId}`);
  };

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    // For debugging tour completion issues
    console.log('Joyride callback:', { action, index, status, type, step: tourSteps[index] });

    if (type === 'step:after' || type === 'target:not-found') {
      const nextIndex = index + (action === 'prev' ? -1 : 1);
      
      // The tour is finished when the user clicks "Next" on the last step
      if (action === 'next' && index === tourSteps.length - 1) {
        setRunTour(false);
        setTourStepIndex(0);
        localStorage.setItem('hasCompletedTour', 'true');
        console.log('Tour explicitly finished on last step next click.');
        return;
      }
      
      const nextStep = tourSteps[nextIndex];
      if (nextStep) {
        if (nextStep.tab && nextStep.tab !== activeTab) {
          handleTabClick(nextStep.tab);
          setTimeout(() => {
            setTourStepIndex(nextIndex);
          }, 300);
        } else {
          setTourStepIndex(nextIndex);
        }
      }
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      setTourStepIndex(0);
      localStorage.setItem('hasCompletedTour', 'true');
      console.log(`Tour officially ${status}. Setting hasCompletedTour.`);
    }
  };

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
    return 'bg-secondary/10 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 text-xs px-1.5 py-0.5 rounded-full';
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
    { id: 'packing', label: 'Packing Assistant', shortLabel: 'Packing', icon: BriefcaseIcon },
    { id: 'collections', label: 'Smart Collections', shortLabel: 'Collections', icon: CubeIcon, badge: 'AI' },
    { id: 'analytics', label: 'Usage Analytics', shortLabel: 'Analytics', icon: ChartBarIcon, badge: 'NEW' },
    { id: 'laundry', label: 'Laundry Assistant', shortLabel: 'Laundry', icon: SparklesIcon, badge: getUrgentItemsCount(laundryAlerts) },
    { id: 'history', label: 'Outfit History', shortLabel: 'History', icon: CloudIcon }
  ];

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <AppTour
        run={runTour}
        stepIndex={tourStepIndex}
        handleJoyrideCallback={handleJoyrideCallback}
      />
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        // Define default options
        className: '',
        duration: 5000,
        style: {
          background: '#F7F7F7', // cloud-white
          color: '#1A1A2E', // midnight-ink
        },
        // Default options for specific types
        success: {
          duration: 3000,
          style: {
            background: '#6F00FF', // electric-indigo
            color: '#F7F7F7', // cloud-white
          }
        },
         // Style for dark mode
        dark: {
          style: {
            background: '#2A2A4A', // dark-subtle
            color: '#F7F7F7', // cloud-white
          }
        }
      }}
    />
      {/* --- Header --- */}
      <header className="bg-background/80 dark:bg-dark-subtle/80 backdrop-blur-sm shadow-sm border-b border-fog dark:border-inkwell sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center">
              <h1 className="text-lg md:text-2xl font-bold font-poppins">
                WeWear<span className="text-primary">.</span>
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <div className="notification-bell"><NotificationBell /></div>
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted dark:hover:bg-inkwell">
                {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6 text-cyber-yellow" />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-muted dark:hover:bg-inkwell md:hidden">
                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>

              <div className="relative">
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="w-9 h-9 bg-muted dark:bg-inkwell rounded-full flex items-center justify-center overflow-hidden">
                  {/* --- CORRECTED LOGIC: Use `profile` object for the image --- */}
                  {profile && profile.profile_image_url ? (
                    <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-6 w-6" />
                  )}
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-dark-subtle rounded-md shadow-lg py-1 border border-fog dark:border-inkwell animate-fadeIn" onMouseLeave={() => setProfileMenuOpen(false)}>
                    <div className="px-4 py-2 text-sm border-b border-fog dark:border-inkwell">
                      <p className="font-semibold">Signed in as</p>
                      <p className="truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => { handleTabClick('profile'); setProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-muted dark:hover:bg-inkwell">My Profile</button>
                    {user?.is_admin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-muted dark:hover:bg-inkwell">Admin</Link>
                    )}
                    <button onClick={() => { handleLogout(); setProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-fog dark:border-inkwell py-2">
              <div className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { handleTabClick(tab.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-secondary/10 text-secondary dark:bg-inkwell dark:text-secondary'
                        : 'text-foreground hover:bg-muted dark:text-cloud-white dark:hover:bg-inkwell'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.badge && <span className={getBadgeStyle(tab.badge)}>{tab.badge}</span>}
                  </button>
                ))}
                <div className="border-t border-fog dark:border-inkwell pt-2 mt-2">
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-lg font-medium">
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
        <div className="border-b border-fog dark:border-inkwell">
          <nav className="-mb-px flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-slate hover:text-inkwell hover:border-fog dark:hover:border-inkwell dark:hover:text-cloud-white'
                } ${
                  (tab.id === 'laundry' ? 'laundry-dashboard-link' : '') +
                  (tab.id === 'packing' ? ' packing-assistant-link' : '')
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card dark:bg-dark-subtle border-t border-fog dark:border-inkwell px-2 py-1 z-30">
        <div className="flex justify-around">
          {tabs.slice(0, 5).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
                activeTab === tab.id
                  ? 'text-secondary'
                  : 'text-slate dark:text-dark-text-secondary hover:bg-muted dark:hover:bg-inkwell'
              } ${
                (tab.id === 'laundry' ? 'laundry-dashboard-link' : '') +
                (tab.id === 'packing' ? ' packing-assistant-link' : '')
              }`}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.badge && <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] px-1 rounded-full">{tab.badge === 'AI' || tab.badge === 'NEW' ? '●' : tab.badge}</span>}
              </div>
              <span className="text-xs mt-1 truncate w-full text-center">{tab.shortLabel || tab.label}</span>
            </button>
          ))}
          <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center py-2 px-1 text-slate dark:text-dark-text-secondary min-w-0">
            <Bars3Icon className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>
      
      {/* --- Page-Specific Controls --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {activeTab === 'outfit' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card dark:bg-dark-subtle rounded-lg shadow-sm border border-fog dark:border-inkwell">
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
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cloud-white mr-2"></div>}
              <span>{loading ? 'Generating...' : 'Generate Outfit'}</span>
            </button>
          </div>
        )}
      </div>
      
      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'outfit' && <div className="animate-fadeIn outfit-generator"><OutfitGenerator outfit={currentOutfit} mood={mood} /></div>}
          {activeTab === 'wardrobe' && <div className="animate-fadeIn wardrobe-manager"><WardrobeManager /></div>}
          {activeTab === 'collections' && <div className="animate-fadeIn"><SmartCollections /></div>}
          {activeTab === 'analytics' && <div className="animate-fadeIn"><UsageAnalytics /></div>}
          {activeTab === 'laundry' && <div className="animate-fadeIn"><LaundryDashboard /></div>}
          {activeTab === 'profile' && <div className="animate-fadeIn"><UserProfile /></div>}
          {activeTab === 'history' && <div className="animate-fadeIn"><OutfitHistory /></div>}
          {activeTab === 'packing' && <div className="animate-fadeIn"><PackingAssistant /></div>}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;