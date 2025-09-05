import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import ImageUpload from './ImageUpload';
import toast from 'react-hot-toast';

const Onboarding = () => {
  const { profile, fetchProfile, updateProfile, updateOnboardingStatus, setRunTourOnLoad } = useWardrobeStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    gender: '',
    profile_image_url: ''
  });

  useEffect(() => {
    // Fetch the profile if it's not already loaded
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  useEffect(() => {
    // Pre-fill form if profile data exists
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        age: profile.age || '',
        gender: profile.gender || '',
        profile_image_url: profile.profile_image_url || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url) => {
    setFormData(prev => ({ ...prev, profile_image_url: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { display_name, age, gender, profile_image_url } = formData;
    
    if (!display_name || !age || !gender) {
      toast.error('Please fill out all fields.');
      return;
    }

    const ageNumber = parseInt(age, 10);
    if (isNaN(ageNumber) || ageNumber <= 0) {
        toast.error('Please enter a valid age.');
        return;
    }

    await updateProfile({
      display_name,
      age: ageNumber,
      gender,
      profile_image_url
    });

    await updateOnboardingStatus({ has_completed_onboarding: true });

    toast.success('Profile created! Welcome to WeWear.');
    setRunTourOnLoad(true); // Signal to the dashboard to start the tour
    navigate('/dashboard'); // Redirect to dashboard after completion
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground dark:text-white">
            Welcome to WeWear!
          </h2>
          <p className="mt-2 text-center text-sm text-slate dark:text-dark-text-secondary">
            Let's set up your profile to get the best experience.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="space-y-4">
              <ImageUpload 
                onImageUploaded={handleImageUpload}
                currentImage={formData.profile_image_url}
              />

              <div>
                <label htmlFor="display_name" className="sr-only">Display Name</label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  required
                  className="input-field appearance-none rounded-md relative block w-full px-3 py-2 border border-fog placeholder-gray-500 text-foreground focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm dark:bg-inkwell dark:border-inkwell dark:placeholder-gray-400 dark:text-white"
                  placeholder="Display Name"
                  value={formData.display_name}
                  onChange={handleChange}
                />
              </div>

              <div className="flex space-x-4">
                <div className="w-1/2">
                    <label htmlFor="age" className="sr-only">Age</label>
                    <input
                        id="age"
                        name="age"
                        type="number"
                        required
                        className="input-field appearance-none rounded-md relative block w-full px-3 py-2 border border-fog placeholder-gray-500 text-foreground focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm dark:bg-inkwell dark:border-inkwell dark:placeholder-gray-400 dark:text-white"
                        placeholder="Age"
                        value={formData.age}
                        onChange={handleChange}
                    />
                </div>
                <div className="w-1/2">
                     <label htmlFor="gender" className="sr-only">Gender</label>
                    <select
                        id="gender"
                        name="gender"
                        required
                        className="input-field appearance-none rounded-md relative block w-full px-3 py-2 border border-fog placeholder-gray-500 text-foreground focus:outline-none focus:ring-secondary focus:border-secondary focus:z-10 sm:text-sm dark:bg-inkwell dark:border-inkwell dark:placeholder-gray-400 dark:text-white"
                        value={formData.gender}
                        onChange={handleChange}
                    >
                        <option value="" disabled>Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="submit" className="btn btn-primary w-full group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
              Complete Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
