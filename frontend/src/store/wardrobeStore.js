import { create } from 'zustand';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useWardrobeStore = create((set, get) => ({
  user: null,
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

  // Helper function to handle fetch responses and errors
  // This centralizes error handling and JSON parsing
  fetchApi: async (url, options = {}) => {
    try {
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers, // Allow custom headers to override defaults
        },
        credentials: 'include', // IMPORTANT: Send cookies with cross-origin requests
      });

      if (response.status === 401) {
        // Handle session expiration globally
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
        throw new Error('Unauthorized'); // Propagate error to specific action catch blocks
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
        throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
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
      const userData = { email, id: data.user_id };
      set({ user: userData, loading: false });
      localStorage.setItem('wardrobeUser', JSON.stringify(userData));
      toast.success("Welcome back!")
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Looks like you are not registered. Try that again :)';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
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
        styleDNA: null
      });
      localStorage.removeItem('wardrobeUser');
    }
  },

  checkAuth: async () => {
    try {
      const data = await get().fetchApi(`${API_BASE}/check-auth`, {
        method: 'GET',
      });
      if (data.authenticated) {
        const userData = { email: data.email, id: data.user_id };
        set({ user: userData });
        localStorage.setItem('wardrobeUser', JSON.stringify(userData));
        return true;
      } else {
        const storedUser = localStorage.getItem('wardrobeUser');
        if (storedUser) {
          localStorage.removeItem('wardrobeUser');
        }
        set({ user: null });
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // The fetchApi helper handles 401, so we just clear local state if an error occurred
      set({ user: null });
      localStorage.removeItem('wardrobeUser');
      return false;
    }
  },

  initUser: async () => {
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
      toast.success('Your profile has been updated!');
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
    const { startDate, endDate } = filters;
    try {
      const params = new URLSearchParams();
      if (startDate) {
        // Format date to YYYY-MM-DD
        params.append('start_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        // Format date to YYYY-MM-DD
        params.append('end_date', endDate.toISOString().split('T')[0]);
      }
      const queryString = params.toString();
      const url = `${API_BASE}/outfit-history${queryString ? `?${queryString}` : ''}`;
      
      const data = await get().fetchApi(url, {
        method: 'GET',
      });

      set({ outfitHistory: data.outfits, loading: false });
      
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
