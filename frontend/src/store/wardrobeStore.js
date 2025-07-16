import { create } from 'zustand';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios to always send credentials
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

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

  // Auth actions (keep existing)
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/login`, { email, password });
      const userData = { email, id: response.data.user_id };
      set({ user: userData, loading: false });
      
      localStorage.setItem('wardrobeUser', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({ error: error.response?.data?.error || 'Login failed', loading: false });
      return false;
    }
  },

  register: async (email, password, location) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/register`, { email, password, location });
      const userData = { email, id: response.data.user_id };
      set({ user: userData, loading: false });
      
      localStorage.setItem('wardrobeUser', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Register error:', error);
      set({ error: error.response?.data?.error || 'Registration failed', loading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_BASE}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
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
      const response = await axios.get(`${API_BASE}/check-auth`);
      if (response.data.authenticated) {
        const userData = { email: response.data.email, id: response.data.user_id };
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
      set({ user: null });
      localStorage.removeItem('wardrobeUser');
      return false;
    }
  },

  initUser: async () => {
    const isAuthenticated = await get().checkAuth();
    
    if (!isAuthenticated) {
      const storedUser = localStorage.getItem('wardrobeUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const isValid = await get().checkAuth();
          if (!isValid) {
            localStorage.removeItem('wardrobeUser');
            set({ user: null });
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('wardrobeUser');
          set({ user: null });
        }
      }
    }
  },

  // Existing wardrobe actions (keep all existing code)
  fetchWardrobe: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_BASE}/get-wardrobe`);
      set({ wardrobe: response.data.items, loading: false });
    } catch (error) {
      console.error('Fetch wardrobe error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch wardrobe', loading: false });
      }
    }
  },

  addClothingItem: async (itemData) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${API_BASE}/add-item`, itemData);
      const newItem = response.data.item;
      set(state => ({
        wardrobe: [...state.wardrobe, newItem],
        loading: false
      }));
      
      // Refresh intelligence data when wardrobe changes
      get().fetchSmartCollections();
      get().fetchWardrobeGaps();
      
      return true;
    } catch (error) {
      console.error('Add item error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to add item', loading: false });
      }
      return false;
    }
  },

  updateClothingItem: async (itemId, itemData) => {
    set({ loading: true });
    try {
      const response = await axios.put(`${API_BASE}/update-item/${itemId}`, itemData);
      const updatedItem = response.data.item;
      
      set(state => ({
        wardrobe: state.wardrobe.map(item => 
          item.id === itemId ? updatedItem : item
        ),
        loading: false
      }));
      return true;
    } catch (error) {
      console.error('Update item error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to update item', loading: false });
      }
      return false;
    }
  },

  deleteClothingItem: async (itemId) => {
    try {
      await axios.delete(`${API_BASE}/delete-item/${itemId}`);
      
      set(state => ({
        wardrobe: state.wardrobe.filter(item => item.id !== itemId)
      }));
      
      // Refresh intelligence data when wardrobe changes
      get().fetchSmartCollections();
      get().fetchWardrobeGaps();
      
      return true;
    } catch (error) {
      console.error('Delete item error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to delete item' });
      }
      return false;
    }
  },

  toggleCleanStatus: async (itemId) => {
    try {
      const response = await axios.patch(`${API_BASE}/toggle-clean/${itemId}`);
      const updatedItem = response.data.item;
      
      set(state => ({
        wardrobe: state.wardrobe.map(item => 
          item.id === itemId ? updatedItem : item
        )
      }));
      return true;
    } catch (error) {
      console.error('Toggle clean error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to update item status' });
      }
      return false;
    }
  },

  // Laundry tracking actions (keep existing)
  fetchLaundryAlerts: async () => {
    set({ laundryLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/laundry/alerts`);
      set({ laundryAlerts: response.data, laundryLoading: false });
    } catch (error) {
      console.error('Fetch laundry alerts error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch laundry alerts', laundryLoading: false });
      }
    }
  },

  fetchWardrobeHealth: async () => {
    set({ laundryLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/laundry/health-score`);
      set({ wardrobeHealth: response.data, laundryLoading: false });
    } catch (error) {
      console.error('Fetch wardrobe health error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch wardrobe health', laundryLoading: false });
      }
    }
  },

  markItemsWashed: async (itemIds) => {
    try {
      await axios.post(`${API_BASE}/laundry/mark-washed`, { item_ids: itemIds });
      
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
      console.error('Mark washed error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to mark items as washed' });
      }
      return false;
    }
  },

  toggleLaundryStatus: async (itemId) => {
    try {
      const response = await axios.patch(`${API_BASE}/laundry/toggle-status/${itemId}`);
      const updatedItem = response.data.item;
      
      set(state => ({
        wardrobe: state.wardrobe.map(item => 
          item.id === itemId ? updatedItem : item
        )
      }));
      
      get().fetchLaundryAlerts();
      return true;
    } catch (error) {
      console.error('Toggle laundry status error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to update laundry status' });
      }
      return false;
    }
  },

  // NEW: Intelligence actions
  fetchSmartCollections: async () => {
    set({ intelligenceLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/intelligence/collections`);
      set({ smartCollections: response.data, intelligenceLoading: false });
    } catch (error) {
      console.error('Fetch smart collections error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch smart collections', intelligenceLoading: false });
      }
    }
  },

  fetchWardrobeGaps: async () => {
    set({ intelligenceLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/intelligence/gaps`);
      set({ wardrobeGaps: response.data, intelligenceLoading: false });
    } catch (error) {
      console.error('Fetch wardrobe gaps error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch wardrobe gaps', intelligenceLoading: false });
      }
    }
  },

  // NEW: Analytics actions
  fetchUsageAnalytics: async () => {
    set({ analyticsLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/analytics/usage`);
      set({ usageAnalytics: response.data, analyticsLoading: false });
    } catch (error) {
      console.error('Fetch usage analytics error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch usage analytics', analyticsLoading: false });
      }
    }
  },

  fetchStyleDNA: async () => {
    set({ analyticsLoading: true });
    try {
      const response = await axios.get(`${API_BASE}/analytics/style-dna`);
      set({ styleDNA: response.data, analyticsLoading: false });
    } catch (error) {
      console.error('Fetch style DNA error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch style DNA', analyticsLoading: false });
      }
    }
  },

  // Outfit actions (keep existing but update to refresh analytics)
  generateOutfit: async (mood) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/get-outfit`, { mood });
      set({ currentOutfit: response.data, loading: false });
    } catch (error) {
      console.error('Generate outfit error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.', loading: false });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to generate outfit', loading: false });
      }
    }
  },

  saveOutfit: async (outfitData) => {
    try {
      const response = await axios.post(`${API_BASE}/save-outfit`, outfitData);
      set(state => ({
        outfitHistory: [response.data.outfit, ...state.outfitHistory]
      }));
      
      // Refresh all analytics when outfits are saved
      get().fetchWardrobe();
      get().fetchLaundryAlerts();
      get().fetchWardrobeHealth();
      get().fetchUsageAnalytics();
      get().fetchStyleDNA();
      
      return true;
    } catch (error) {
      console.error('Save outfit error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.' });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to save outfit' });
      }
      return false;
    }
  },

  fetchOutfitHistory: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_BASE}/outfit-history`);
      set({ outfitHistory: response.data.outfits, loading: false });
    } catch (error) {
      console.error('Fetch history error:', error);
      if (error.response?.status === 401) {
        set({ user: null, error: 'Session expired. Please login again.', loading: false });
        localStorage.removeItem('wardrobeUser');
      } else {
        set({ error: 'Failed to fetch outfit history', loading: false });
      }
    }
  },

  clearError: () => set({ error: null }),
}));

export default useWardrobeStore;