import React, { useState, useEffect } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import axios from 'axios';
import ImageUpload from './ImageUpload';
import EditItemModal from './EditItemModal';
import BrandCombobox from './BrandCombobox';
import SkeletonCard from './SkeletonCard';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PhotoIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const WardrobeManager = () => {
  const { 
    wardrobe, 
    fetchWardrobe, 
    addClothingItem, 
    updateClothingItem, 
    deleteClothingItem, 
    toggleCleanStatus, 
    loading 
  } = useWardrobeStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingItem, setEditingItem] = useState(null);

  const [newItem, setNewItem] = useState({
    name: '', type: '', color: '', style: '', fit: '', pattern: '', season: 'all',
    brand: '', fabric: '', mood_tags: [], image_url: '',
    purchase_date: '',
    purchase_cost: '',
    care_instructions: { notes: '' },
    wash_temperature: 'cold',
    dry_clean_only: false,
    needs_repair: false,
    repair_notes: '',
    retirement_candidate: false
  });

  useEffect(() => {
    // Only fetch the wardrobe if it's not already loaded.
    if (wardrobe.length === 0) {
      fetchWardrobe();
    }
  }, [wardrobe.length, fetchWardrobe]);

  const submitBrandForReview = async (brandName) => {
    if (!brandName || !brandName.trim()) {
      return; // Don't submit empty brand names
    }
    try {
      // This is a "fire and forget" request. We don't need to block the UI
      // or show an error to the user, as it's a background process.
      await axios.post('/api/brands', { name: brandName.trim() });
    } catch (error) {
      // Log the error for debugging, but don't bother the user.
      console.error('Failed to submit brand for review:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    const success = await addClothingItem(newItem);
    if (success) {
      // Submit the brand for review in the background
      submitBrandForReview(newItem.brand);
      
      setNewItem({
        name: '', type: '', color: '', style: '', season: 'all',
        brand: '', fabric: '', mood_tags: [], image_url: '',
        purchase_date: '',
        purchase_cost: '',
        care_instructions: { notes: '' },
        wash_temperature: 'cold',
        dry_clean_only: false,
        needs_repair: false,
        repair_notes: '',
        retirement_candidate: false
      });
      setShowAddForm(false);
    }
  };

  const handleEditItem = async (itemId, itemData) => {
    const success = await updateClothingItem(itemId, itemData);
    if (success) {
      // Submit the brand for review in the background
      submitBrandForReview(itemData.brand);
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      await deleteClothingItem(itemId);
    }
  };

  const handleToggleClean = (itemId) => toggleCleanStatus(itemId);
  const handleImageUpload = (imageUrl) => setNewItem(prev => ({ ...prev, image_url: imageUrl }));
  const handleMoodTagsChange = (tag) => {
    setNewItem(prev => ({
      ...prev,
      mood_tags: prev.mood_tags.includes(tag)
        ? prev.mood_tags.filter(t => t !== tag)
        : [...prev.mood_tags, tag]
    }));
  };

  const filteredWardrobe = wardrobe.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.color.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[...Array(8)].map((_, index) => <SkeletonCard key={index} />)}
    </div>
  );

  const clothingTypes = [...new Set(wardrobe.map(item => item.type))];
  const moodTags = ['casual', 'formal', 'sporty', 'cozy', 'elegant', 'trendy', 'vintage'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold">My Wardrobe</h2>
          <p>{wardrobe.length} items</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 appearance-none w-full"
            >
              <option value="all">All Types</option>
              {clothingTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
            </select>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary add-item-button">
            {showAddForm ? 'Cancel' : 'Add Piece'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg shadow-lg p-6 border border-fog dark:border-inkwell">
          <h3 className="text-lg font-medium mb-6">Add New Piece</h3>
          <form onSubmit={handleAddItem} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Photo</label>
              <ImageUpload onImageUploaded={handleImageUpload} currentImage={newItem.image_url} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Item Name *</label>
                <input type="text" required value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="w-full" placeholder="e.g., Blue Denim Jacket" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select required value={newItem.type} onChange={(e) => setNewItem({...newItem, type: e.target.value})} className="w-full">
                  <option value="">Select type</option>
                  <option value="shirt">Shirt</option><option value="t-shirt">T-Shirt</option><option value="blouse">Blouse</option><option value="sweater">Sweater</option><option value="jacket">Jacket</option><option value="coat">Coat</option><option value="pants">Pants</option><option value="jeans">Jeans</option><option value="shorts">Shorts</option><option value="skirt">Skirt</option><option value="dress">Dress</option><option value="shoes">Shoes</option><option value="sneakers">Sneakers</option><option value="boots">Boots</option><option value="accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color *</label>
                <input type="text" required value={newItem.color} onChange={(e) => setNewItem({...newItem, color: e.target.value})} className="w-full" placeholder="e.g., Navy Blue" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Style *</label>
                <select required value={newItem.style} onChange={(e) => setNewItem({...newItem, style: e.target.value})} className="w-full">
                  <option value="">Select style</option>
                  <option value="casual">Casual</option><option value="formal">Formal</option><option value="business">Business</option><option value="sporty">Sporty</option><option value="elegant">Elegant</option><option value="bohemian">Bohemian</option><option value="vintage">Vintage</option><option value="trendy">Trendy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fit</label>
                <input type="text" value={newItem.fit} onChange={(e) => setNewItem({...newItem, fit: e.target.value})} className="w-full" placeholder="e.g., slim, relaxed, oversized" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pattern</label>
                <input type="text" value={newItem.pattern} onChange={(e) => setNewItem({...newItem, pattern: e.target.value})} className="w-full" placeholder="e.g., solid, striped, floral" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Season</label>
                <select value={newItem.season} onChange={(e) => setNewItem({...newItem, season: e.target.value})} className="w-full">
                  <option value="all">All seasons</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="fall">Fall</option><option value="winter">Winter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Brand</label>
                <BrandCombobox
                  value={newItem.brand}
                  onChange={(newValue) => setNewItem({ ...newItem, brand: newValue })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fabric</label>
                <input type="text" value={newItem.fabric} onChange={(e) => setNewItem({...newItem, fabric: e.target.value})} className="w-full" placeholder="e.g., Cotton, Wool" />
              </div>
            </div>

            <div className="border-t border-fog dark:border-inkwell pt-6 mt-6">
                <h4 className="text-md font-medium mb-4">Purchase & Care Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Purchase Date</label>
                        <input type="date" value={newItem.purchase_date} onChange={(e) => setNewItem({...newItem, purchase_date: e.target.value})} className="w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Purchase Cost ($)</label>
                        <input type="number" step="0.01" value={newItem.purchase_cost} onChange={(e) => setNewItem({...newItem, purchase_cost: e.target.value})} className="w-full" placeholder="e.g., 59.99" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Wash Temperature</label>
                        <select value={newItem.wash_temperature} onChange={(e) => setNewItem({...newItem, wash_temperature: e.target.value})} className="w-full">
                            <option value="cold">Cold</option>
                            <option value="warm">Warm</option>
                            <option value="hot">Hot</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-6">
                        <input type="checkbox" id="dry_clean_only_add" checked={newItem.dry_clean_only} onChange={(e) => setNewItem({...newItem, dry_clean_only: e.target.checked})} className="h-4 w-4 rounded" />
                        <label htmlFor="dry_clean_only_add" className="ml-2 block text-sm">Dry Clean Only</label>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Care Instructions</label>
                        <input type="text" value={newItem.care_instructions.notes || ''} onChange={(e) => setNewItem({...newItem, care_instructions: {notes: e.target.value}})} className="w-full" placeholder="e.g., Hand wash cold, lay flat to dry" />
                    </div>
                </div>
            </div>

            <div className="border-t border-fog dark:border-inkwell pt-6 mt-6">
                <h4 className="text-md font-medium mb-4">Maintenance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                        <input type="checkbox" id="needs_repair_add" checked={newItem.needs_repair} onChange={(e) => setNewItem({...newItem, needs_repair: e.target.checked})} className="h-4 w-4 rounded" />
                        <label htmlFor="needs_repair_add" className="ml-2 block text-sm">Needs Repair</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="retirement_candidate_add" checked={newItem.retirement_candidate} onChange={(e) => setNewItem({...newItem, retirement_candidate: e.target.checked})} className="h-4 w-4 rounded" />
                        <label htmlFor="retirement_candidate_add" className="ml-2 block text-sm">Retirement Candidate</label>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Repair Notes</label>
                        <textarea value={newItem.repair_notes} onChange={(e) => setNewItem({...newItem, repair_notes: e.target.value})} className="w-full" rows="2" placeholder="e.g., Missing a button, small tear on sleeve"></textarea>
                    </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mood Tags</label>
              <div className="flex flex-wrap gap-2">
                {moodTags.map(tag => (
                  <button key={tag} type="button" onClick={() => handleMoodTagsChange(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      newItem.mood_tags.includes(tag)
                        ? 'bg-secondary/10 border-indigo-300 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700'
                        : 'bg-muted border-fog hover:bg-muted dark:bg-inkwell dark:border-inkwell dark:hover:bg-gray-600'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                <span>{loading ? 'Adding...' : 'Add Item'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && wardrobe.length === 0 ? <LoadingSkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredWardrobe.map(item => (
            <div key={item.id} className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group border border-fog dark:border-inkwell">
              <div className="aspect-square bg-muted dark:bg-inkwell relative">
                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate">
                    <PhotoIcon className="h-16 w-16" />
                  </div>
                )}
                <button onClick={() => handleToggleClean(item.id)}
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                    item.is_clean 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                      : 'bg-destructive/10 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  }`}
                  title={`Click to mark as ${item.is_clean ? 'dirty' : 'clean'}`}>
                  {item.is_clean ? <><CheckCircleIcon className="h-3 w-3 inline mr-1" />Clean</> : <><XCircleIcon className="h-3 w-3 inline mr-1" />Dirty</>}
                </button>
                <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingItem(item)} className="p-2 bg-card dark:bg-dark-subtle/80 dark:bg-gray-900/70 backdrop-blur-sm rounded-full shadow-md transition-all hover:scale-105" title="Edit item">
                    <PencilIcon className="h-4 w-4 text-secondary dark:text-secondary" />
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-card dark:bg-dark-subtle/80 dark:bg-gray-900/70 backdrop-blur-sm rounded-full shadow-md transition-all hover:scale-105" title="Delete item">
                    <TrashIcon className="h-4 w-4 text-destructive dark:text-destructive" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-medium mb-1 truncate">{item.name}</h3>
                <p className="text-sm mb-2">{item.type} • {item.color}</p>
                <div className="flex justify-between items-center text-sm">
                  <span>{item.brand || 'No brand'}</span>
                  <span className="capitalize">{item.season}</span>
                </div>
                {item.mood_tags && item.mood_tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.mood_tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-muted dark:bg-inkwell text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {item.mood_tags.length > 3 && <span className="px-2 py-1 bg-muted dark:bg-inkwell text-xs rounded-full">+{item.mood_tags.length - 3}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredWardrobe.length === 0 && (
        <div className="text-center py-12 bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg border border-fog dark:border-inkwell">
          <PhotoIcon className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm || filterType !== 'all' ? 'No matches found.' : 'Your wardrobe is looking a bit sparse.'}
          </h3>
          <p className="mb-4">
            {searchTerm || filterType !== 'all' ? 'Try a different search?' : 'Ready to add your first piece and unlock your style?'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
              Add Your First Piece
            </button>
          )}
        </div>
      )}

      {editingItem && (
        <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleEditItem} loading={loading} />
      )}
    </div>
  );
};

export default WardrobeManager;