// src/components/UserProfile.jsx

import React, { useEffect, useState, useRef } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { toast } from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import { UserCircleIcon, LockClosedIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';

const UserProfile = () => {
  const {
    profile,
    profileLoading,
    fetchProfile,
    updateProfile,
    changePassword,
    exportData,
    deleteAccount,
    resetOutfitHistory,
  } = useWardrobeStore();

  // State for the controlled form inputs
  const [formData, setFormData] = useState({
    display_name: '',
    location: '',
    profile_image_url: '',
    laundry_thresholds: {},
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
  });

  const locationInputRef = useRef(null);
  useGooglePlacesAutocomplete(locationInputRef, (place) => {
    setFormData(prev => ({ ...prev, location: place }));
  });

  // Fetch profile data when the component mounts
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // When profile data is loaded from the store, update our local form state
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        location: profile.location || '',
        profile_image_url: profile.profile_image_url || '',
        laundry_thresholds: profile.laundry_thresholds || {},
      });
    }
  }, [profile]);

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
    updateProfile(formData);
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
    if (window.confirm("Are you sure you want to reset your AI personalization? This will delete all of your outfit history and cannot be undone.")) {
        await resetOutfitHistory();
    }
  };

  if (profileLoading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Loading Your Profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* --- 1. General Information Section --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-6">
          <UserCircleIcon className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h2 className="text-xl font-bold">General Information</h2>
            <p className="text-sm">Update your public profile and location details.</p>
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
              <div>
                <label className="block text-sm font-medium mb-2">Location (for weather)</label>
                <input ref={locationInputRef} type="text" name="location" value={formData.location} onChange={handleFormChange} className="w-full" />
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

      {/* --- 2. Laundry Thresholds Section --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Laundry Preferences</h2>
        <p className="text-sm mb-6">Set how many times you wear an item before it needs washing.</p>
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
            {profileLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* --- 3. Security Section --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-6">
          <LockClosedIcon className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
          <div>
            <h2 className="text-xl font-bold">Security</h2>
            <p className="text-sm">Change your password.</p>
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
            <button type="submit" className="btn btn-secondary">Change Password</button>
          </div>
        </form>
      </div>
      
      {/* --- 4. Data & Account Actions Section --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
         <div className="space-y-4">
           <div>
              <h3 className="font-semibold">Export Your Data</h3>
              <p className="text-sm mb-2">Download a JSON file of all your wardrobe and outfit data.</p>
              <button onClick={exportData} className="btn btn-secondary sm:min-w-[200px]">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Data
              </button>
           </div>
           <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-orange-600 dark:text-orange-500">Reset AI Personalization</h3>
            <p className="text-sm mb-2">Reset the AI's memory of your style by deleting all your past outfit history. Your wardrobe items will not be affected.</p>
            <button onClick={handleResetHistory} className="btn btn-warning sm:min-w-[200px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
                Reset AI Memory
            </button>
           </div>
           <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
             <h3 className="font-semibold text-red-600 dark:text-red-500">Delete Account</h3>
             <p className="text-sm mb-2">Permanently delete your account and all of your data. This action is irreversible.</p>
             <button onClick={handleDeleteAccount} className="btn btn-danger sm:min-w-[200px]">
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete My Account
              </button>
           </div>
         </div>
      </div>
    </div>
  );
};

export default UserProfile;