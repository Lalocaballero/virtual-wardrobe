import { create } from 'zustand';
import toast from 'react-hot-toast';

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useWardrobeStore = create((set, get) => ({
  user: null,
  theme: 'purple', // Default theme
  wardrobe: [],
  currentOutfit: null,
  outfitHistory: [],
  loading: false,
  error: null,
  analyticsLoading: false,

  // --- NEW PROFILE STATE ---
  profile: null,
  profileLoading: false,
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

  // Trips state
  trips: [],
  currentTripPackingList: null,
  tripsLoading: false,

  // Notifications state
  notifications: [],
  notificationsLoading: false,

  // Theme actions
  setTheme: (theme) => {
    set({ theme });
    // Apply theme class to the root element
    const root = document.documentElement;
    // Remove old theme classes
    root.classList.remove('theme-purple', 'theme-blue', 'theme-orange');
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    // Persist to local storage
    localStorage.setItem('we-wear-theme', theme);
  },

  initTheme: () => {
    const savedTheme = localStorage.getItem('we-wear-theme');
    if (savedTheme) {
      get().setTheme(savedTheme);
    } else {
      get().setTheme('purple'); // Default theme
    }
  },

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
      toast.success("Welcome back!")
      return { success: true };
    } catch (error) {
      const errorMessage = error.data?.error || error.message || 'Login failed.';
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
      const errorMessage = error.message || 'Failed to send password reset email.';
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
      const errorMessage = error.message || 'Failed to reset password.';
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
      toast.success(data.message);
      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to resend verification email.';
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
      const userData = { email, id: data.user_id };
      set({ user: userData, loading: false });
      localStorage.setItem('wardrobeUser', JSON.stringify(userData));
      toast.success("Welcome to WeWear!")
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Opsi... There has been a problem, please try again.';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage); 
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
    get().initTheme(); // Initialize theme on app start
    // initUser now primarily relies on checkAuth to determine user status
    await get().checkAuth();
    // The rest of the logic in initUser is largely redundant if checkAuth is robust
    // and correctly clears user/localStorage on 401 or network errors.
  },

  // ======================
  // PROFILE ACTIONS
  // ======================

  fetchProfile: async () => {
    set({ profileLoading: true });
    try {
      const data = await get().fetchApi(`${API_BASE}/profile`, {
        method: 'GET',
      });
      set({ profile: data, profileLoading: false });
      if (data.theme) {
        get().setTheme(data.theme);
      }
    } catch (error) {
      const errorMessage = error.message || "Oops! We couldn't fetch your profile.";
      set({ error: errorMessage, profileLoading: false });
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
      if (profileData.theme) {
        get().setTheme(profileData.theme);
      }
      // The backend will now create a notification for this, so the toast is no longer needed.
    } catch (error) {
      const errorMessage = error.message || 'There was a problem saving your profile.';
      set({ error: errorMessage, profileLoading: false });
      toast.error(errorMessage);
    }
  },

  changePassword: async (passwordData) => {
    try {
      const data = await get().fetchApi(`${API_BASE}/profile/change-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
      toast.success(data.message || 'Password changed successfully!');
      return true; // Indicate success
    } catch (error) {
      const errorMessage = error.message || 'Failed to change password.';
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
      toast.success('Your data is downloading!');
    } catch (error) {
      const errorMessage = error.message || 'Could not export your data.';
      toast.error(errorMessage);
    }
  },
  
  deleteAccount: async (password) => {
    try {
      const data = await get().fetchApi(`${API_BASE}/profile/delete-account`, {
          method: 'POST',
          body: JSON.stringify({ password: password }),
      });
      toast.success(data.message || 'Account deleted. We are sorry to see you go!');
      // After deleting, force a logout to clear all state
      get().logout(); 
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete account.';
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
      toast.success(data.message || 'AI Personalization has been reset.');
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to reset AI personalization.';
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
      const errorMessage = error.message || 'Failed to fetch trips.';
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
      toast.success('Trip created successfully!');
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to create trip.';
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
      toast.success('Trip deleted successfully!');
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete trip.';
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
      toast.success('Trip updated successfully!');
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to update trip.';
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
        toast.success('Your smart packing list is ready!');
      }
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get packing list.';
      set({ error: errorMessage, tripsLoading: false, currentTripPackingList: null });
      toast.error(errorMessage);
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
      toast.error('Failed to update item status.');
      return false;
    }
  },

  completeTrip: async (tripId) => {
    set({ tripsLoading: true });
    try {
      await get().fetchApi(`${API_BASE}/trips/${tripId}/complete`, {
        method: 'POST',
      });
      toast.success('Trip completed! Packed items are now in your laundry list.');
      // Refetch trips to update status, or manually update state
      get().fetchTrips();
      // Optionally clear the packing list view
      set({ currentTripPackingList: null, tripsLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to complete trip.';
      set({ error: errorMessage, tripsLoading: false });
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
      toast.error('Failed to fetch notifications.');
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
      toast.error('Failed to mark notification as read.');
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
      toast.error('Failed to mark all notifications as read.');
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
      const errorMessage = error.message || 'Ups, we are having problems fetching your wardrobe.';
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
      toast.success('Lets go! That is ready to rock.');
      get().fetchSmartCollections();
      get().fetchWardrobeGaps();
      
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Give us a second, we are having problems to add that item.';
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
      toast.success("Updated correctly, Let's go!");
      return true;
    } catch (error) {
      const errorMessage = error.message || 'We are so sorry we run on squirrels.';
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
      toast.success('Sad to see this one go :(');
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Awww... apparetly we cannot delete this one :( try it again';
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
        toast.success(`'${updatedItem.name}' is now clean! ✨`);
      } else {
        toast(`'${updatedItem.name}' marked as dirty.`);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Opsi dopsi... try that again please.';
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
        toast(`You have ${totalUrgentCount} items that need washing soon! 🧺`);
      } 

    } catch (error) {
      const errorMessage = error.message || 'Looks like our pigeons got lost on the way. Try that again please.';
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
      const errorMessage = error.message || 'Sorry, we think your wardrobe is a bit sick.';
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
      toast.success('Washed! Too good to go.')
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to mark items as washed.';
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
      toast.success('Laundry status toggled!');
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to toggle laundry status.';
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
      toast.success('Smart collections are ready to rock!');
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch smart collections.';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  fetchWardrobeGaps: async () => {
    set({ intelligenceLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/intelligence/gaps`, {
        method: 'GET',
      });
      set({ wardrobeGaps: data, intelligenceLoading: false });
      toast.success('Wardrobe gaps are ready to rock!');
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch wardrobe gaps.';
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
      toast.success('Usage analytics are ready to go!');
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch usage analytics.';
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
      toast.success('Style DNA is ready to rock!');
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch style DNA.';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Outfit actions
  generateOutfit: async (mood) => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/get-outfit`, {
        method: 'POST',
        body: JSON.stringify({ mood }),
      });
      set({ currentOutfit: data, loading: false });
      toast.success('Your outfit for today is ready!')
    } catch (error) {
      const errorMessage = error.message || 'Opsi... we have a problem generating your outfit.';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
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
      toast.success('Outfit used, you look amazing!');
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Failed to save your outfit.';
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
        toast.success(`Showing ${data.outfits.length} outfits for the selected range.`);
      }

    } catch (error) {
      const errorMessage = error.message || 'Could not fetch outfit history.';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useWardrobeStore;