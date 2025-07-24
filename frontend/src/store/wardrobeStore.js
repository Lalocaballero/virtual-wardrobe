import { create } from 'zustand';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useWardrobeStore = create((set, get) => ({
  user: null,
  wardrobe: [],
  currentOutfit: null,
  outfitHistory: [],
  loading: false,
  error: null,
  
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
      return true;
    } catch (error) {
      set({ error: error.message || 'Looks like you are not registered. Try that again :)', loading: false });
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
      return true;
    } catch (error) {
      set({ error: error.message || 'Opsi... There has been a problem, please try again.', loading: false });
      return false;
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

  // Existing wardrobe actions
  fetchWardrobe: async () => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/get-wardrobe`, {
        method: 'GET',
      });
      set({ wardrobe: data.items, loading: false });
    } catch (error) {
      set({ error: error.message || 'Ups, we are having problems fetching your wardrobe.', loading: false });
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
      
      get().fetchSmartCollections();
      get().fetchWardrobeGaps();
      
      return true;
    } catch (error) {
      set({ error: error.message || 'Give us a second, we are trying to add that item.', loading: false });
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
      return true;
    } catch (error) {
      set({ error: error.message || 'We are so sorry we run on squirrels.', loading: false });
      return false;
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
      
      return true;
    } catch (error) {
      set({ error: error.message || 'You sure you want to delete that item?' });
      return false;
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
      return true;
    } catch (error) {
      set({ error: error.message || 'Is it really clean?' });
      return false;
    }
  },

  // Laundry tracking actions
  fetchLaundryAlerts: async () => {
    set({ laundryLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/laundry/alerts`, {
        method: 'GET',
      });
      set({ laundryAlerts: data, laundryLoading: false });
    } catch (error) {
      set({ error: error.message || 'Looks like our pigeons got lost on the way.', laundryLoading: false });
    }
  },

  fetchWardrobeHealth: async () => {
    set({ laundryLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/laundry/health-score`, {
        method: 'GET',
      });
      set({ wardrobeHealth: data, laundryLoading: false });
    } catch (error) {
      set({ error: error.message || 'Sorry, we think your wardrobe is a bit sick.', laundryLoading: false });
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
      
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to mark items as washed' });
      return false;
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
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to update laundry status' });
      return false;
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
      set({ error: error.message || 'Failed to fetch smart collections', intelligenceLoading: false });
    }
  },

  fetchWardrobeGaps: async () => {
    set({ intelligenceLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/intelligence/gaps`, {
        method: 'GET',
      });
      set({ wardrobeGaps: data, intelligenceLoading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch wardrobe gaps', intelligenceLoading: false });
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
    } catch (error) {
      set({ error: error.message || 'Failed to fetch usage analytics', analyticsLoading: false });
    }
  },

  fetchStyleDNA: async () => {
    set({ analyticsLoading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/analytics/style-dna`, {
        method: 'GET',
      });
      set({ styleDNA: data, analyticsLoading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch style DNA', analyticsLoading: false });
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
    } catch (error) {
      set({ error: error.message || 'Failed to generate outfit', loading: false });
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
      
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to save outfit' });
      return false;
    }
  },

  fetchOutfitHistory: async () => {
    set({ loading: true, error: null });
    try {
      const data = await get().fetchApi(`${API_BASE}/outfit-history`, {
        method: 'GET',
      });
      set({ outfitHistory: data.outfits, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch outfit history', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useWardrobeStore;
