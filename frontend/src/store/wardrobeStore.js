import { create } from 'zustand';
import toast from 'react-hot-toast';

export const API_BASE = (() => {
  let apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  // Ensure the production URL has the /api suffix, making it more resilient to configuration errors.
  if (process.env.REACT_APP_API_URL && !process.env.REACT_APP_API_URL.endsWith('/api')) {
    apiBase = `${process.env.REACT_APP_API_URL}/api`;
  }
  return apiBase;
})();

const useWardrobeStore = create((set, get) => ({
  user: null,
  authChecked: false, // Track if the initial auth check has been performed
  wardrobe: [],
  currentOutfit: null,
  outfitHistory: [],
  loading: false,
  error: null,

  // --- NEW PROFILE STATE ---
  profile: null,
  profileLoading: false,
  isSyncing: false,
  isSmartSyncing: false,
  shouldRunTourOnLoad: false, // For triggering the app tour
  // --- END NEW PROFILE STATE ---

  // --- NEW IMPERSONATION STATE ---
  isImpersonating: false,
  impersonationToken: null,
  originalAdminUser: null,
  // --- END NEW IMPERSONATION STATE ---

  // Laundry tracking state
  laundryAlerts: null,
  wardrobeHealth: null,
  laundryLoading: false,

  // NEW: Intelligence & Analytics state
  smartCollections: null,
  wardrobeGaps: null,
  usageAnalytics: null,
  styleDNA: null,
  intelligenceLoading: false,
  analyticsLoading: false,

  // Trips state
  trips: [],
  currentTripPackingList: null,
  tripsLoading: false,

  // Notifications state
  notifications: [],
  notificationsLoading: false,

  // Helper function to handle fetch responses and errors
  // This centralizes error handling and JSON parsing
  fetchApi: async (url, options = {}) => {
    try {
      const impersonationToken = get().impersonationToken;
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      if (impersonationToken) {
        defaultHeaders['Authorization'] = `Bearer ${impersonationToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers, // Allow custom headers to override defaults
        },
        credentials: 'include', // IMPORTANT: Send cookies with cross-origin requests
      });

      if (response.status === 401) {
        if (get().isImpersonating) {
            get().stopImpersonation();
            toast.error("Impersonation session expired. Returning to admin view.");
        } else {
            set({ user: null, error: 'Session expired. Please login again.' });
            localStorage.removeItem('wardrobeUser');
        }
        throw new Error('Unauthorized');
      }

      if (response.status === 429) {
        const user = get().profile;
        if (user && !user.is_premium) {
            const error = new Error("You have reached the maximum permitted requests. Please upgrade for better limits.");
            error.code = 'UPGRADE_REQUIRED';
            throw error;
        }
        throw new Error("Ups, you are doing this a bit too fast, wait a bit longer to do this");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        error.response = response;
        error.data = errorData;
        throw error;
      }

      // Handle cases where response might be empty (e.g., DELETE, POST without content)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return {}; // Return empty object for non-JSON responses (e.g., 204 No Content)

    } catch (error) {
      console.error('API call error:', error);
      // Re-throw to be caught by individual action's catch blocks
      throw error; 
    }
  },

  // Auth actions
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const userData = { email, id: data.user_id, is_admin: data.is_admin };
      set({ user: userData, loading: false });
      localStorage.setItem('wardrobeUser', JSON.stringify(userData));
      toast.success("Welcome back! Let's get you styled.");
      return { success: true };
    } catch (error) {
      const errorMessage = error.data?.error || error.message || 'Login failed. Check your credentials?';
      const errorCode = error.data?.code;
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false, code: errorCode };
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      set({ loading: false });
      return { success: true, message: data.message };
    } catch (error) {
      const errorMessage = error.message || "Hmm, that email didn't want to send. Mind trying again?";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false };
    }
  },

  resetPassword: async (token, password) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      set({ loading: false });
      return { success: true, message: data.message };
    } catch (error) {
      const errorMessage = error.message || "That password reset didn't stick. Let's give it another shot.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false };
    }
  },

  resendVerificationEmail: async (email) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/resend-verification`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success(data.message || "Verification email sent! Check your inbox.");
      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage = error.message || "Couldn't resend the verification email. Maybe a typo?";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  register: async (email, password, location) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/register`, {
        method: 'POST',
        body: JSON.stringify({ email, password, location }),
      });
      // DO NOT log the user in. They must verify their email first.
      set({ loading: false });
      toast.success(data.message || "You're in! Check your email to verify your account.");
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || "Whoops! Something went wrong. Let's try that again.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return { success: false };
    }
  },

  logout: async () => {
    try {
      await get().fetchApi(`${API_BASE}/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error); // Log, but don't block UI reset
    } finally {
      set({ 
        user: null, 
        wardrobe: [], 
        currentOutfit: null, 
        outfitHistory: [],
        laundryAlerts: null,
        wardrobeHealth: null,
        smartCollections: null,
        wardrobeGaps: null,
        usageAnalytics: null,
        styleDNA: null,
        isImpersonating: false,
        impersonationToken: null,
        originalAdminUser: null,
      });
      localStorage.removeItem('wardrobeUser');
      localStorage.removeItem('impersonationData');
    }
  },

  startImpersonation: (token, userToImpersonate) => {
    const originalUser = get().user;
    const impersonationData = {
      isImpersonating: true,
      impersonationToken: token,
      originalAdminUser: originalUser,
      impersonatedUser: userToImpersonate,
    };
    
    set({ 
      isImpersonating: true,
      impersonationToken: token,
      originalAdminUser: originalUser,
      user: userToImpersonate
    });

    localStorage.setItem('impersonationData', JSON.stringify(impersonationData));
    toast.success(`Now impersonating ${userToImpersonate.email}`);
    get().fetchWardrobe();
  },

  stopImpersonation: async () => {
    const originalAdminUser = get().originalAdminUser;
    
    set({
      isImpersonating: false,
      impersonationToken: null,
      originalAdminUser: null,
      user: originalAdminUser
    });

    localStorage.removeItem('impersonationData');
    toast.success('Returned to your admin session.');
    get().fetchWardrobe();
  },

  checkAuth: async () => {
    const impersonationDataString = localStorage.getItem('impersonationData');
    if (impersonationDataString) {
        const impersonationData = JSON.parse(impersonationDataString);
        set({
            isImpersonating: impersonationData.isImpersonating,
            impersonationToken: impersonationData.impersonationToken,
            originalAdminUser: impersonationData.originalAdminUser,
            user: impersonationData.impersonatedUser,
        });
    }

    try {
      const data = await get().fetchApi(`${API_BASE}/check-auth`, {
        method: 'GET',
      });
      if (data.authenticated && !get().isImpersonating) {
        const userData = { email: data.email, id: data.user_id, is_admin: data.is_admin };
        set({ user: userData });
        localStorage.setItem('wardrobeUser', JSON.stringify(userData));
        return true;
      } else if (!data.authenticated && !get().isImpersonating) {
        const storedUser = localStorage.getItem('wardrobeUser');
        if (storedUser) {
          localStorage.removeItem('wardrobeUser');
        }
        set({ user: null });
        return false;
      }
      return get().user != null;
    } catch (error) {
      if (!get().isImpersonating) {
          console.error('Auth check error:', error);
          set({ user: null });
          localStorage.removeItem('wardrobeUser');
      }
      return false;
    }
  },

  initUser: async () => {
    try {
      await get().checkAuth();
    } catch (error) {
      console.error("Error during initial auth check:", error);
    } finally {
      // Mark the initial auth check as complete, regardless of outcome.
      set({ authChecked: true });
    }
  },

  // ======================
  // PROFILE ACTIONS
  // ======================

  setRunTourOnLoad: (value) => set({ shouldRunTourOnLoad: value }),

  fetchProfile: async () => {
    set({ profileLoading: true });
    try {
      const data = await get().fetchApi(`${API_BASE}/profile`, {
        method: 'GET',
      });
      set({ profile: data, profileLoading: false });
    } catch (error) {
      const errorMessage = error.message || "We couldn't seem to find your profile. It might be playing hide and seek.";
      set({ error: errorMessage, profileLoading: false });
      toast.error(errorMessage);
    }
  },

  updateOnboardingStatus: async (statusData) => {
    try {
      await get().fetchApi(`${API_BASE}/profile/onboarding-status`, {
        method: 'POST',
        body: JSON.stringify(statusData),
      });
      // After updating, refetch the profile to get the latest data
      await get().fetchProfile();
    } catch (error) {
      const errorMessage = error.message || "Couldn't update your onboarding status.";
      toast.error(errorMessage);
    }
  },

  updateProfile: async (profileData) => {
    set({ profileLoading: true });
    try {
      await get().fetchApi(`${API_BASE}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      // After updating, refetch the profile to get the latest data
      await get().fetchProfile();
      // The backend will now create a notification for this, so the toast is no longer needed.
    } catch (error) {
      const errorMessage = error.message || "Your profile changes didn't save. Want to try again?";
      set({ error: errorMessage, profileLoading: false });
      toast.error(errorMessage);
    }
  },

  syncSubscription: async () => {
    set({ isSyncing: true });
    const previousPremiumStatus = get().profile?.is_premium;
    try {
      await get().fetchApi(`${API_BASE}/profile/sync-subscription`, {
        method: 'POST',
      });
      // After syncing, refetch the full profile to get the latest data.
      await get().fetchProfile();
      const newPremiumStatus = get().profile?.is_premium;

      // Only show toast if the status changed from false to true
      if (newPremiumStatus === true && previousPremiumStatus === false) {
        toast.success('Subscription status updated! Welcome to Premium! ✨');
      }
    } catch (error) {
      const errorMessage = error.message || "We couldn't sync your subscription. Let's try that again.";
      toast.error(errorMessage);
    } finally {
      set({ isSyncing: false });
    }
  },

  handlePostCheckoutSync: async () => {
    set({ isSmartSyncing: true });

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const maxRetries = 5;
    const retryInterval = 3000; // 3 seconds

    for (let i = 0; i < maxRetries; i++) {
        await get().syncSubscription();
        const isPremium = get().profile?.is_premium;
        if (isPremium) {
            // The regular syncSubscription already shows the "Welcome" toast.
            set({ isSmartSyncing: false });
            return;
        }
        // If not premium yet, wait before the next try.
        if (i < maxRetries - 1) {
          await sleep(retryInterval);
        }
    }

    // If it's still not premium after all retries
    toast.error("Your subscription is still being confirmed. We'll have you sorted in a jiffy.");
    set({ isSmartSyncing: false });
  },

  changePassword: async (passwordData) => {
    try {
      const data = await get().fetchApi(`${API_BASE}/profile/change-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
      toast.success(data.message || 'Password updated. Your account is now extra secure.');
      return true; // Indicate success
    } catch (error) {
      const errorMessage = error.message || "That password change didn't take. Let's try another.";
      toast.error(errorMessage);
      return false; // Indicate failure
    }
  },

  exportData: async () => {
    try {
      // fetchApi isn't ideal for file downloads, so we use a direct fetch
      const response = await fetch(`${API_BASE}/profile/export-data`, {
        method: 'GET',
        credentials: 'include', // Don't forget to send cookies!
      });

      if (!response.ok) {
        throw new Error('Failed to export data.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from response header if available, otherwise create one
      const disposition = response.headers.get('content-disposition');
      let filename = 'wewear_export.json';
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Your data is on its way! Check your downloads.');
    } catch (error) {
      const errorMessage = error.message || "We couldn't export your data. It seems to be a bit shy.";
      toast.error(errorMessage);
    }
  },
  
  deleteAccount: async (password) => {
    try {
      const data = await get().fetchApi(`${API_BASE}/profile/delete-account`, {
          method: 'POST',
          body: JSON.stringify({ password: password }),
      });
      toast.success(data.message || "Account deleted. We'll miss your style.");
      // After deleting, force a logout to clear all state
      get().logout(); 
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't delete your account. It seems to be holding on tight.";
      toast.error(errorMessage);
      return false;
    }
  },
  
  resetOutfitHistory: async () => {
    try {
      const data = await get().fetchApi(`${API_BASE}/profile/reset-outfit-history`, {
          method: 'POST',
      });
      // After resetting, clear local history and refetch analytics to reflect the change
      set({ outfitHistory: [] });
      get().fetchUsageAnalytics();
      get().fetchStyleDNA();
      toast.success(data.message || 'Your style profile has been reset. A fresh start!');
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't reset your style profile. It's a bit stubborn.";
      toast.error(errorMessage);
      return false;
    }
  },
  
  // Trip actions
  fetchTrips: async () => {
    set({ tripsLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/trips`, {
        method: 'GET',
      });
      set({ trips: data, tripsLoading: false });
    } catch (error) {
      const errorMessage = error.message || 'Oof, we hit a snag trying to load your trips. Want to give it another go?';
      set({ error: errorMessage, tripsLoading: false });
      toast.error(errorMessage);
    }
  },

  createTrip: async (tripData) => {
    set({ tripsLoading: true, error: null });
    try {
      const newTrip = await get().fetchApi(`${API_BASE}/trips`, {
        method: 'POST',
        body: JSON.stringify(tripData),
      });
      set(state => ({
        trips: [...state.trips, newTrip],
        tripsLoading: false
      }));
      toast.success('Trip created! Time to start packing.');
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't create your trip. Let's try that again.";
      set({ error: errorMessage, tripsLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  deleteTrip: async (tripId) => {
    set({ tripsLoading: true, error: null });
    try {
      await get().fetchApi(`${API_BASE}/trips/${tripId}`, {
        method: 'DELETE',
      });
      set(state => ({
        trips: state.trips.filter(trip => trip.id !== tripId),
        tripsLoading: false
      }));
      toast.success('Trip deleted. Less packing for you!');
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't delete your trip. It must be a good one!";
      set({ error: errorMessage, tripsLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  updateTrip: async (tripId, tripData) => {
    set({ tripsLoading: true });
    try {
      const updatedTrip = await get().fetchApi(`${API_BASE}/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify(tripData),
      });
      set(state => ({
        trips: state.trips.map(trip => 
          trip.id === tripId ? updatedTrip : trip
        ),
        tripsLoading: false,
      }));
      toast.success('Trip updated. Your plans are looking sharp.');
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't update your trip. Let's try that again.";
      set({ error: errorMessage, tripsLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  fetchPackingList: async (tripId) => {
    set({ tripsLoading: true, error: null, currentTripPackingList: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/trips/${tripId}/packing-list`, {
        method: 'GET',
      });
      set({ currentTripPackingList: data, tripsLoading: false });
      if (!data.was_cached) { // A hypothetical field to check if it was newly generated
        toast.success("Your smart packing list is ready. Let's get packing!");
      }
      return data;
    } catch (error) {
        if (error.code === 'UPGRADE_REQUIRED') {
            toast.error(
                (t) => (
                    <span>
                        {error.message}
                        <button
                            onClick={() => {
                                window.location.href = '/dashboard/profile';
                                toast.dismiss(t.id);
                            }}
                            className="ml-2 btn btn-primary btn-sm"
                        >
                            Upgrade
                        </button>
                    </span>
                ),
                { duration: 6000 }
            );
        } else {
            const errorMessage = error.message || "We couldn't generate your packing list. The AI might be on a coffee break.";
            toast.error(errorMessage);
        }
        set({ error: error.message, tripsLoading: false, currentTripPackingList: null });
        return null;
    }
  },

  togglePackedItem: async (itemId) => {
    try {
      const updatedItem = await get().fetchApi(`${API_BASE}/packing-list-items/${itemId}/toggle`, {
        method: 'POST',
      });
      
      set(state => {
        const list = state.currentTripPackingList;
        if (!list) return {};
        
        const updatedItems = list.items.map(item => 
          item.id === itemId ? updatedItem : item
        );
        
        return {
          currentTripPackingList: { ...list, items: updatedItems }
        };
      });
      return true;
    } catch (error) {
      toast.error("We couldn't update that item's status. Let's try again.");
      return false;
    }
  },

  completeTrip: async (tripId) => {
    set({ tripsLoading: true });
    try {
      await get().fetchApi(`${API_BASE}/trips/${tripId}/complete`, {
        method: 'POST',
      });
      toast.success("Trip complete! We've added your packed items to the laundry list.");
      // Refetch trips to update status, or manually update state
      get().fetchTrips();
      // Optionally clear the packing list view
      set({ currentTripPackingList: null, tripsLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't mark your trip as complete. Let's try that again.";
      set({ error: errorMessage, tripsLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  submitPackingListFeedback: async (packingListId, feedbackData) => {
    try {
      await get().fetchApi(`${API_BASE}/packing-list/${packingListId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      });
      toast.success('Got it! Thanks for the feedback.');
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't submit your feedback. It might be too good!";
      toast.error(errorMessage);
      return false;
    }
  },

  // Notification actions
  fetchNotifications: async () => {
    set({ notificationsLoading: true });
    try {
      const data = await get().fetchApi(`${API_BASE}/notifications`, {
        method: 'GET',
      });
      set({ notifications: data, notificationsLoading: false });
    } catch (error) {
      set({ notificationsLoading: false });
      toast.error("We couldn't fetch your notifications. They're playing hard to get.");
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      await get().fetchApi(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
      }));
    } catch (error) {
      toast.error("Couldn't mark that as read. Let's try again.");
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      await get().fetchApi(`${API_BASE}/notifications/mark-all-read`, {
        method: 'POST',
      });
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      }));
    } catch (error) {
      toast.error("We couldn't mark all notifications as read. A bit stubborn, aren't they?");
    }
  },

  // Existing wardrobe actions
  fetchWardrobe: async () => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/get-wardrobe`, {
        method: 'GET',
      });
      set({ wardrobe: data.items, loading: false });
    } catch (error) {
      const errorMessage = error.message || "We're having trouble fetching your wardrobe. It might be hiding.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage); 
    }
  },

  addClothingItem: async (itemData) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/add-item`, {
        method: 'POST',
        body: JSON.stringify(itemData),
      });
      const newItem = data.item;
      set(state => ({
        wardrobe: [...state.wardrobe, newItem],
        loading: false
      }));
      toast.success("Looking sharp! That's been added to your wardrobe.");
      get().fetchSmartCollections();
      get().fetchWardrobeGaps();
      
      return true;
    } catch (error) {
      const errorMessage = error.message || "We're having a little trouble adding that item. One more try?";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  updateClothingItem: async (itemId, itemData) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/update-item/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
      });
      const updatedItem = data.item;
      
      set(state => ({
        wardrobe: state.wardrobe.map(item => 
          item.id === itemId ? updatedItem : item
        ),
        loading: false
      }));
      toast.success('Item updated. All set!');
      return true;
    } catch (error) {
      const errorMessage = error.message || "Looks like the squirrels in our server room are on a break. Try again?";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  deleteClothingItem: async (itemId) => {
    try {
      await get().fetchApi(`${API_BASE}/delete-item/${itemId}`, {
        method: 'DELETE',
      });
      
      set(state => ({
        wardrobe: state.wardrobe.filter(item => item.id !== itemId)
      }));
      
      get().fetchSmartCollections();
      get().fetchWardrobeGaps();
      toast.success("Item deleted. Hope it wasn't a favorite!");
      return true;
    } catch (error) {
      const errorMessage = error.message || "This item is a bit stubborn! Couldn't delete it. Try again?";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

toggleCleanStatus: async (itemId) => {
    try {
      const data = await get().fetchApi(`${API_BASE}/toggle-clean/${itemId}`, {
        method: 'PATCH',
      });
      const updatedItem = data.item;
      
      set(state => ({
        wardrobe: state.wardrobe.map(item => 
          item.id === itemId ? updatedItem : item
        )
      }));

      if (updatedItem.is_clean) {
        toast.success(`'${updatedItem.name}' is sparkling clean! ✨`);
      } else {
        toast(`'${updatedItem.name}' is in the dirty pile.`);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error.message || "Whoops! That didn't work. Let's try that again.";
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

// --- Corrected pattern for fetchLaundryAlerts ---
fetchLaundryAlerts: async () => {
    set({ laundryLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/laundry/alerts`, {
        method: 'GET',
      });
      set({ laundryAlerts: data, laundryLoading: false });

      const urgentItemCount = data?.urgent_items?.length || 0;
      const highPriorityCount = data?.high_priority?.length || 0;
      const totalUrgentCount = urgentItemCount + highPriorityCount;

      if (totalUrgentCount > 0) {
        toast(`Heads up! You've got ${totalUrgentCount} items that need a wash soon. 🧺`);
      } 

    } catch (error) {
      const errorMessage = error.message || "Our carrier pigeons seem to be lost. Could you try that again?";
      set({ error: errorMessage, laundryLoading: false });
      toast.error(errorMessage);
    }
  },

fetchWardrobeHealth: async () => {
    set({ laundryLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/laundry/health-score`, {
        method: 'GET',
      });
      set({ wardrobeHealth: data, laundryLoading: false });

      if (data && data.message) {
        if (data.score >= 75) {
          toast.success(data.message);
        } else if (data.score >= 40) {
          toast(data.message); 
        } else {
          toast.error(data.message); 
        }
      }

    } catch (error) {
      const errorMessage = error.message || "Your wardrobe's health score couldn't be calculated. It might be feeling under the weather.";
      set({ error: errorMessage, laundryLoading: false });
      toast.error(errorMessage);
    }
  },

  markItemsWashed: async (itemIds) => {
    try {
      await get().fetchApi(`${API_BASE}/laundry/mark-washed`, {
        method: 'POST',
        body: JSON.stringify({ item_ids: itemIds }),
      });
      
      set(state => ({
        wardrobe: state.wardrobe.map(item => 
          itemIds.includes(item.id) ? {
            ...item,
            wear_count_since_wash: 0,
            is_clean: true,
            needs_washing: false,
            wash_urgency: 'none',
            laundry_status: 'clean',
            last_washed: new Date().toISOString()
          } : item
        )
      }));
      
      get().fetchLaundryAlerts();
      get().fetchWardrobeHealth();
      toast.success('All clean! Those items are ready for their next adventure.');
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't mark those items as washed. Let's try that again.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  toggleLaundryStatus: async (itemId) => {
    try {
      const data = await get().fetchApi(`${API_BASE}/laundry/toggle-status/${itemId}`, {
        method: 'PATCH',
      });
      const updatedItem = data.item;
      
      set(state => ({
        wardrobe: state.wardrobe.map(item => 
          item.id === itemId ? updatedItem : item
        )
      }));
      
      get().fetchLaundryAlerts();
      toast.success('Laundry status updated!');
      return true;
    } catch (error) {
      const errorMessage = error.message || "Couldn't toggle the laundry status. Mind trying again?";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Intelligence actions
  fetchSmartCollections: async () => {
    set({ intelligenceLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/intelligence/collections`, {
        method: 'GET',
      });
      set({ smartCollections: data, intelligenceLoading: false });
    } catch (error) {
      // Per user request, this error toast is not helpful and should be removed.
      // We will log the error for debugging but not show a toast to the user.
      console.error("Failed to fetch smart collections:", error);
      set({ intelligenceLoading: false }); // Still need to turn off loading indicator
    }
  },

  fetchWardrobeGaps: async () => {
    set({ intelligenceLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/intelligence/gaps`, {
        method: 'GET',
      });
      set({ wardrobeGaps: data, intelligenceLoading: false });
      toast.success("We've found some gaps in your wardrobe. Take a look.");
    } catch (error) {
      const errorMessage = error.message || "Couldn't find any wardrobe gaps. Maybe your collection is perfect?";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Analytics actions
  fetchUsageAnalytics: async () => {
    set({ analyticsLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/analytics/usage`, {
        method: 'GET',
      });
      set({ usageAnalytics: data, analyticsLoading: false });
      toast.success("Your style stats are in. See how you've been dressing.");
    } catch (error) {
      const errorMessage = error.message || "We couldn't get your style stats. They're a bit shy.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  fetchStyleDNA: async () => {
    set({ analyticsLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/analytics/style-dna`, {
        method: 'GET',
      });
      set({ styleDNA: data, analyticsLoading: false });
      toast.success("We've analyzed your style DNA. See what makes you, you.");
    } catch (error) {
      const errorMessage = error.message || "We couldn't get your style DNA. It's a bit of a mystery.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Outfit actions
  generateOutfit: async (mood, exclude_ids = []) => {
    set({ loading: true, error: null });
    try {
      const payload = { mood };
      if (exclude_ids && exclude_ids.length > 0) {
        payload.exclude_ids = exclude_ids;
      }
      const data = await get().fetchApi(`${API_BASE}/get-outfit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      set({ currentOutfit: data, loading: false });
      toast.success('Voilà! Your next great outfit is ready.');
    } catch (error) {
        if (error.code === 'UPGRADE_REQUIRED') {
            toast.error(
                (t) => (
                    <span>
                        {error.message}
                        <button
                            onClick={() => {
                                window.location.href = '/dashboard/profile';
                                // Here you might want to switch to the billing tab
                                toast.dismiss(t.id);
                            }}
                            className="ml-2 btn btn-primary btn-sm"
                        >
                            Upgrade
                        </button>
                    </span>
                ),
                { duration: 6000 }
            );
        } else {
            const errorMessage = error.message || 'The outfit generator is stumped. Try a different mood?';
            toast.error(errorMessage);
        }
        set({ error: error.message, loading: false });
    }
  },

  saveOutfit: async (outfitData) => {
    try {
      const data = await get().fetchApi(`${API_BASE}/save-outfit`, {
        method: 'POST',
        body: JSON.stringify(outfitData),
      });
      set(state => ({
        outfitHistory: [data.outfit, ...state.outfitHistory]
      }));
      
      // Refresh all analytics when outfits are saved
      get().fetchWardrobe();
      get().fetchLaundryAlerts();
      get().fetchWardrobeHealth();
      get().fetchUsageAnalytics();
      get().fetchStyleDNA();
      toast.success('Outfit saved! You rocked it.');
      return true;
    } catch (error) {
      const errorMessage = error.message || "We couldn't save your outfit. It must have been too good for our servers.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  fetchOutfitHistory: async (filters = {}) => {
    set({ loading: true, error: null });
    const { startDate, endDate, year, month } = filters;
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('start_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('end_date', endDate.toISOString().split('T')[0]);
      }
      if (year) {
        params.append('year', year);
      }
      if (month) {
        params.append('month', month);
      }

      const queryString = params.toString();
      const url = `${API_BASE}/outfit-history${queryString ? `?${queryString}` : ''}`;
      
      const data = await get().fetchApi(url, {
        method: 'GET',
      });

      set({ outfitHistory: data.outfits, loading: false });
      
      // Only show toast for manual date range filtering, not for calendar navigation
      if (startDate || endDate) {
        toast.success(`Found ${data.outfits.length} outfits. Lookin' good!`);
      }

    } catch (error) {
      const errorMessage = error.message || "We couldn't find your outfit history. It must be lost in the laundry.";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useWardrobeStore;