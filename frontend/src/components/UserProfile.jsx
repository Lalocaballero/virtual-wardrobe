// src/components/UserProfile.jsx

import React, { useEffect, useState, useRef } from 'react';
import { ChartPieIcon, CubeIcon, ArchiveBoxIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import ImageUpload from './ImageUpload';
import { UserCircleIcon, LockClosedIcon, ArrowDownTrayIcon, TrashIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import Billing from './Billing';

const StatCard = ({ title, value, icon: Icon, isLoading }) => (
    <div className="bg-background dark:bg-dark-subtle/50 p-4 rounded-lg flex items-center space-x-4">
        <div className="bg-secondary/10 dark:bg-indigo-900/50 p-3 rounded-full">
            <Icon className="h-6 w-6 text-secondary dark:text-secondary" />
        </div>
        <div>
            <p className="text-sm text-slate dark:text-dark-text-secondary">{title}</p>
            {isLoading ? (
                <div className="h-7 bg-muted dark:bg-inkwell rounded w-12 mt-1 animate-pulse"></div>
            ) : (
                <p className="text-2xl font-bold">{value}</p>
            )}
        </div>
    </div>
);

const UserProfile = () => {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const location = useLocation();
  const {
    profile,
    profileLoading,
    updateProfile,
    changePassword,
    exportData,
    deleteAccount,
    resetOutfitHistory,
    syncSubscription,
    isSyncing,
    handlePostCheckoutSync,
    isSmartSyncing,
  } = useWardrobeStore();

  // State for the controlled form inputs
  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    gender: '',
    location: '',
    profile_image_url: '',
    laundry_thresholds: {},
    notification_settings: {},
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
  });

  const [negativePrompts, setNegativePrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState('');

  const locationInputRef = useRef(null);
  useGooglePlacesAutocomplete(locationInputRef, (e) => handleFormChange(e), formData.location);

  // Fetch profile data and sync subscription status on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('from_checkout') === 'true') {
      handlePostCheckoutSync();
      // Optionally, remove the query param from the URL so it doesn't run again on refresh
      window.history.replaceState(null, '', location.pathname);
    }
    // The redundant `else { syncSubscription() }` block has been removed,
    // as it was causing an infinite loop. Profile data is now reliably fetched
    // by the parent ProtectedRoute component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We explicitly want this to run only ONCE on mount.

  // When profile data is loaded from the store, update our local form state
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        location: profile.location || '',
        profile_image_url: profile.profile_image_url || '',
        age: profile.age || '',
        gender: profile.gender || '',
        laundry_thresholds: profile.laundry_thresholds || {},
        notification_settings: profile.notification_settings || {},
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/profile/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching profile stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchNegativePrompts = async () => {
      try {
        const response = await fetch('/api/profile/negative-prompts');
        if (response.ok) {
          const data = await response.json();
          setNegativePrompts(data);
        }
      } catch (error) {
        console.error("Error fetching negative prompts:", error);
      }
    };

    fetchStats();
    fetchNegativePrompts();
  }, []);

  const handleAddNegativePrompt = async () => {
    if (!newPrompt.trim()) return;
    try {
      const response = await fetch('/api/profile/negative-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_text: newPrompt }),
      });
      if (response.ok) {
        const addedPrompt = await response.json();
        setNegativePrompts(prev => [addedPrompt, ...prev]);
        setNewPrompt('');
      }
    } catch (error) {
      console.error("Error adding negative prompt:", error);
    }
  };

  const handleDeleteNegativePrompt = async (promptId) => {
    if (window.confirm("Are you sure you want to ditch this rule?")) {
      try {
        const response = await fetch(`/api/profile/negative-prompts/${promptId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setNegativePrompts(prev => prev.filter(p => p.id !== promptId));
        }
      } catch (error) {
        console.error("Error deleting negative prompt:", error);
      }
    }
  };

  const handleNotificationSettingChange = (setting) => {
    setFormData(prev => ({
        ...prev,
        notification_settings: {
            ...prev.notification_settings,
            [setting]: !prev.notification_settings[setting],
        }
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThresholdChange = (itemType, value) => {
    const newThresholds = { ...formData.laundry_thresholds, [itemType]: parseInt(value) || 0 };
    setFormData(prev => ({ ...prev, laundry_thresholds: newThresholds }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfileImageUpload = (imageUrl) => {
    setFormData(prev => ({...prev, profile_image_url: imageUrl}));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // To ensure the autocomplete value is captured even if the user doesn't select an item
    // from the dropdown, we read the value directly from the input ref.
    const finalFormData = {
      ...formData,
      location: locationInputRef.current ? locationInputRef.current.value : formData.location,
    };
    updateProfile(finalFormData);
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const success = await changePassword(passwordData);
    if (success) {
      setPasswordData({ current_password: '', new_password: '' }); // Clear fields on success
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt("This action is irreversible. To confirm, please enter your password:");
    if (password) {
      await deleteAccount(password);
    }
  };

  const handleResetHistory = async () => {
    if (window.confirm("Are you sure you want to reset the AI's memory? This will delete your entire outfit history and can't be undone.")) {
        await resetOutfitHistory();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto profile-tour-target">
      {(profileLoading && !profile) ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3">Loading Your Profile...</span>
        </div>
      ) : (
        <>
          {profile && profile.is_premium && (
              <div className="bg-accent text-accent-foreground p-4 rounded-lg shadow-lg flex items-center space-x-3">
                  <span className="text-2xl">✨</span>
                  <div>
                      <h3 className="font-bold">You're a Premium Member!</h3>
                      <p className="text-sm">Unlimited AI suggestions, packing lists, and all our best features are yours. Thanks for the support!</p>
                  </div>
              </div>
          )}

          {/* --- Wardrobe Stats Section --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard 
                  title="Total Items" 
                  value={stats?.total_items} 
                  icon={CubeIcon}
                  isLoading={statsLoading}
              />
              <StatCard 
                  title="Total Outfits" 
                  value={stats?.total_outfits} 
                  icon={ChartPieIcon}
                  isLoading={statsLoading}
              />
              <StatCard 
                  title="Items Never Worn" 
                  value={stats?.items_never_worn} 
                  icon={ArchiveBoxIcon}
                  isLoading={statsLoading}
              />
          </div>

          <div className="flex border-b border-fog dark:border-inkwell">
              <button
                  onClick={() => setActiveSubTab('profile')}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium ${activeSubTab === 'profile' ? 'border-b-2 border-indigo-500 text-secondary' : 'border-b-2 border-transparent text-slate hover:text-inkwell'}`}
              >
                  <UserCircleIcon className="h-5 w-5" />
                  <span>Profile</span>
              </button>
              {true && (
                  <button
                      onClick={() => setActiveSubTab('billing')}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium ${activeSubTab === 'billing' ? 'border-b-2 border-indigo-500 text-secondary' : 'border-b-2 border-transparent text-slate hover:text-inkwell'}`}
                      disabled={isSyncing || profileLoading || isSmartSyncing}
                  >
                      <CreditCardIcon className="h-5 w-5" />
                      <span>Billing & Subscription</span>
                      {(isSyncing || isSmartSyncing) && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 ml-2"></div>}
                  </button>
              )}
          </div>

          {activeSubTab === 'profile' && (
              <div className="space-y-8">
                  {/* --- 1. General Information Section --- */}
                  <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm border border-fog dark:border-inkwell">
          <div className="flex items-center space-x-4 mb-6">
            <UserCircleIcon className="h-10 w-10 text-secondary" />
            <div>
              <h2 className="text-xl font-bold">Your Deets</h2>
              <p className="text-sm">The basics. This helps us get the weather right and personalize your experience.</p>
            </div>
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <ImageUpload onImageUploaded={handleProfileImageUpload} currentImage={formData.profile_image_url} />
              </div>
              <div className="sm:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input type="text" name="display_name" value={formData.display_name} onChange={handleFormChange} className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium mb-2">Age</label>
                      <input type="number" name="age" value={formData.age} onChange={handleFormChange} className="w-full" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-2">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleFormChange} className="w-full">
                          <option value="" disabled>Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location (for weather)</label>
                  <input ref={locationInputRef} type="text" name="location" defaultValue={formData.location} onChange={handleFormChange} className="w-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={profileLoading} className="btn btn-primary">
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* --- NEW: Style Rules Section --- */}
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm border border-fog dark:border-inkwell">
            <div className="flex items-center space-x-4 mb-6">
                <ShieldExclamationIcon className="h-10 w-10 text-secondary" />
                <div>
                    <h2 className="text-xl font-bold">Your Style Rules</h2>
                    <p className="text-sm">Teach the AI what not to pair. It's smart, but you're the boss.</p>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        placeholder="e.g., 'Never pair black and brown'"
                        className="flex-grow"
                    />
                    <button onClick={handleAddNegativePrompt} className="btn btn-secondary">Add Rule</button>
                </div>
                <div className="space-y-2">
                    {negativePrompts.length > 0 ? (
                        negativePrompts.map(prompt => (
                            <div key={prompt.id} className="flex items-center justify-between bg-background dark:bg-inkwell/50 p-3 rounded-md">
                                <p className="text-sm">{prompt.prompt_text}</p>
                                <button onClick={() => handleDeleteNegativePrompt(prompt.id)} className="text-gray-400 hover:text-red-500">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate text-center py-4">You haven't added any style rules yet.</p>
                    )}
                </div>
            </div>
        </div>

        {/* --- 2. Laundry Thresholds Section --- */}
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm border border-fog dark:border-inkwell">
          <h2 className="text-xl font-bold mb-4">Laundry Day Rules</h2>
          <p className="text-sm mb-6">How many wears before an item is officially 'dirty'?</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(formData.laundry_thresholds).map(([itemType, value]) => (
              <div key={itemType}>
                <label className="block text-sm font-medium capitalize">{itemType.replace('-', ' ')}</label>
                <input 
                  type="number" 
                  value={value} 
                  onChange={(e) => handleThresholdChange(itemType, e.target.value)}
                  className="w-full mt-1" 
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleSaveChanges} disabled={profileLoading} className="btn btn-primary">
              {profileLoading ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        </div>

        {/* --- Notification Settings Section --- */}
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm border border-fog dark:border-inkwell">
          <h2 className="text-xl font-bold mb-4">Ping Me About...</h2>
          <p className="text-sm mb-6">Choose what's important enough to buzz your phone.</p>
          <div className="space-y-4">
            {Object.entries(formData.notification_settings).map(([setting, value]) => (
              <div key={setting} className="flex items-center justify-between">
                <span className="font-medium capitalize">{setting.replace(/_/g, ' ')}</span>
                <button
                  type="button"
                  onClick={() => handleNotificationSettingChange(setting)}
                  className={`${
                    value ? 'bg-primary' : 'bg-muted'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      value ? 'translate-x-5' : 'translate-x-0'
                    } inline-block h-5 w-5 transform rounded-full bg-card dark:bg-dark-subtle shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleSaveChanges} disabled={profileLoading} className="btn btn-primary">
              {profileLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* --- 3. Security Section --- */}
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm border border-fog dark:border-inkwell">
          <div className="flex items-center space-x-4 mb-6">
            <LockClosedIcon className="h-10 w-10 text-secondary" />
            <div>
              <h2 className="text-xl font-bold">Password & Security</h2>
              <p className="text-sm">Keep your account secure.</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} className="w-full" required />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn btn-secondary">Update Password</button>
            </div>
          </form>
        </div>
        
        {/* --- 4. Data & Account Actions Section --- */}
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-6 rounded-lg shadow-sm border border-fog dark:border-inkwell">
           <div className="space-y-4">
             <div>
                <h3 className="font-semibold">Export Your Data</h3>
                <p className="text-sm mb-2">Download a JSON file of your entire digital wardrobe.</p>
                <button onClick={exportData} className="btn btn-secondary sm:min-w-[200px]">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download My Data
                </button>
             </div>
             <div className="border-t border-fog dark:border-inkwell pt-4">
              <h3 className="font-semibold text-warning">Reset AI Personalization</h3>
              <p className="text-sm mb-2">Give the AI a fresh start by deleting your outfit history. Your wardrobe is safe.</p>
              <button onClick={handleResetHistory} className="btn btn-warning sm:min-w-[200px]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
                  Reset AI Memory
              </button>
             </div>
             <div className="border-t border-fog dark:border-inkwell pt-4">
               <h3 className="font-semibold text-destructive">Delete Account</h3>
               <p className="text-sm mb-2">Permanently delete your account and all data. No take-backs!</p>
               <button onClick={handleDeleteAccount} className="btn btn-destructive sm:min-w-[200px]">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete My Account
                </button>
             </div>
           </div>
        </div>
              </div>
          )}

          {true && activeSubTab === 'billing' && (
              <Billing />
          )}
        </>
      )}
    </div>
  );
};

export default UserProfile;