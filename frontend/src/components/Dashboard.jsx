import React, { useState, useEffect } from 'react';
import { 
  SunIcon,
  MoonIcon, 
  CloudIcon, 
  UserIcon, 
  SparklesIcon,
  ChartBarIcon,
  CubeIcon,
  BeakerIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import useWardrobeStore from '../store/wardrobeStore';
import OutfitGenerator from './OutfitGenerator';
import WardrobeManager from './WardrobeManager';
import OutfitHistory from './OutfitHistory';
import LaundryDashboard from './LaundryDashboard';
import SmartCollections from './SmartCollections';
import UsageAnalytics from './UsageAnalytics';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('outfit');
  const [mood, setMood] = useState('casual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const { 
    currentOutfit, 
    generateOutfit, 
    loading, 
    logout,
    laundryAlerts,
    usageAnalytics 
  } = useWardrobeStore();

  const toggleTheme = () => {
     setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const moodOptions = [
    { value: 'casual', label: 'Casual', emoji: '😌' },
    { value: 'professional', label: 'Professional', emoji: '👔' },
    { value: 'sporty', label: 'Sporty', emoji: '🏃‍♂️' },
    { value: 'cozy', label: 'Cozy', emoji: '🏠' },
    { value: 'date', label: 'Date Night', emoji: '💕' },
    { value: 'party', label: 'Party', emoji: '🎉' }
  ];

  const tabs = [
    { 
      id: 'outfit', 
      label: 'Today\'s Outfit', 
      shortLabel: 'Outfit',
      icon: SunIcon,
      category: 'daily'
    },
    { 
      id: 'wardrobe', 
      label: 'My Wardrobe', 
      shortLabel: 'Wardrobe',
      icon: UserIcon,
      category: 'manage'  
    },
    { 
      id: 'collections', 
      label: 'Smart Collections', 
      shortLabel: 'Collections',
      icon: CubeIcon,
      category: 'intelligence',
      badge: 'AI'
    },
    { 
      id: 'analytics', 
      label: 'Usage Analytics', 
      shortLabel: 'Analytics',
      icon: ChartBarIcon,
      category: 'intelligence',
      badge: 'NEW'
    },
    { 
      id: 'laundry', 
      label: 'Laundry Assistant', 
      shortLabel: 'Laundry',
      icon: SparklesIcon,
      category: 'smart',
      badge: getUrgentItemsCount(laundryAlerts)
    },
    { 
      id: 'history', 
      label: 'Outfit History', 
      shortLabel: 'History',
      icon: CloudIcon,
      category: 'manage'
    }
  ];

  function getUrgentItemsCount(alerts) {
    if (!alerts) return null;
    const urgentCount = (alerts.urgent_items?.length || 0) + (alerts.high_priority?.length || 0);
    return urgentCount > 0 ? urgentCount.toString() : null;
  }

  const handleGenerateOutfit = () => {
    generateOutfit(mood);
  };

  const handleLogout = () => {
    logout();
  };

  const getBadgeStyle = (badge) => {
    if (!badge) return '';
    
    if (badge === 'AI') {
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full';
    } else if (badge === 'NEW') {
      return 'bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full';
    } else if (parseInt(badge) > 0) {
      return 'bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center';
    }
    return 'bg-indigo-100 text-indigo-800 text-xs px-1.5 py-0.5 rounded-full';
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            {/* Mobile Logo */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1.5 md:p-2 rounded-lg">
                <BeakerIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">WeWear</h1>
                <p className="text-xs text-gray-500 hidden sm:block">AI-Powered Style Intelligence</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2">
              {/* Quick Stats - Mobile Condensed */}
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                {usageAnalytics?.efficiency_metrics && (
                  <div className="text-center px-2 py-1 bg-indigo-50 rounded">
                    <div className="text-sm font-bold text-indigo-600">
                      {usageAnalytics.efficiency_metrics.utilization_rate}%
                    </div>
                  </div>
                )}
                {laundryAlerts && (
                  <div className={`text-center px-2 py-1 rounded ${
                    (laundryAlerts.urgent_items?.length || 0) > 0 ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <div className={`text-sm font-bold ${
                      (laundryAlerts.urgent_items?.length || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {laundryAlerts.clean_items_available || 0}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                ) : (
                  <SunIcon className="h-6 w-6 text-yellow-500" />
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-gray-600" />
                )}
              </button>

              {/* Desktop Logout */}
              <button
                onClick={handleLogout}
                className="hidden md:block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <div className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={getBadgeStyle(tab.badge)}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Outfit Controls - Mobile Optimized */}
          {activeTab === 'outfit' && (
            <div className="border-t border-gray-100 py-3 space-y-3 md:hidden">
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full rounded-lg border-gray-300 text-sm"
              >
                {moodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateOutfit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{loading ? 'Generating...' : 'Generate Outfit'}</span>
              </button>
            </div>
          )}

          {/* Desktop Outfit Controls */}
          {activeTab === 'outfit' && (
            <div className="hidden md:flex items-center justify-between border-t border-gray-100 pt-3">
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {moodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateOutfit}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{loading ? 'Generating...' : 'Generate Outfit'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Tab Navigation */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={getBadgeStyle(tab.badge)}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-30">
        <div className="flex justify-around">
          {tabs.slice(0, 5).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors min-w-0 flex-1 ${
                activeTab === tab.id
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full min-w-[16px] text-center text-[10px]">
                    {tab.badge === 'AI' || tab.badge === 'NEW' ? '•' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 truncate w-full text-center">
                {tab.shortLabel || tab.label}
              </span>
            </button>
          ))}
          {/* More button for remaining tabs */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center py-2 px-1 text-gray-500 min-w-0"
          >
            <Bars3Icon className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'outfit' && (
            <div className="animate-fadeIn">
              <OutfitGenerator outfit={currentOutfit} mood={mood} />
            </div>
          )}
          
          {activeTab === 'wardrobe' && (
            <div className="animate-fadeIn">
              <WardrobeManager />
            </div>
          )}
          
          {activeTab === 'collections' && (
            <div className="animate-fadeIn">
              <SmartCollections />
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="animate-fadeIn">
              <UsageAnalytics />
            </div>
          )}
          
          {activeTab === 'laundry' && (
            <div className="animate-fadeIn">
              <LaundryDashboard />
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="animate-fadeIn">
              <OutfitHistory />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;