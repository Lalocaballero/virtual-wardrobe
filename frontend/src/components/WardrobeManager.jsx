import React, { useState, useEffect } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import ImageUpload from './ImageUpload';
import EditItemModal from './EditItemModal';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PhotoIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const backendRootUrl = API_BASE.replace('/api', '');

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
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    type: '',
    color: '',
    style: '',
    season: 'all',
    brand: '',
    fabric: '',
    mood_tags: [],
    image_url: ''
  });

  useEffect(() => {
    fetchWardrobe();
  }, [fetchWardrobe]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    const success = await addClothingItem(newItem);
    if (success) {
      setNewItem({
        name: '',
        type: '',
        color: '',
        style: '',
        season: 'all',
        brand: '',
        fabric: '',
        mood_tags: [],
        image_url: ''
      });
      setShowAddForm(false);
    }
  };

  const handleEditItem = async (itemId, itemData) => {
    const success = await updateClothingItem(itemId, itemData);
    if (success) {
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      const success = await deleteClothingItem(itemId);
      if (success) {
        setDeletingItemId(null);
      }
    }
  };

  const handleToggleClean = async (itemId) => {
    await toggleCleanStatus(itemId);
  };

  const handleImageUpload = (imageUrl) => {
    setNewItem(prev => ({ ...prev, image_url: imageUrl }));
  };

  const handleMoodTagsChange = (tag) => {
    setNewItem(prev => ({
      ...prev,
      mood_tags: prev.mood_tags.includes(tag)
        ? prev.mood_tags.filter(t => t !== tag)
        : [...prev.mood_tags, tag]
    }));
  };

  // Filter wardrobe items
  const filteredWardrobe = wardrobe.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.color.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const clothingTypes = [...new Set(wardrobe.map(item => item.type))];
  const moodTags = ['casual', 'formal', 'sporty', 'cozy', 'elegant', 'trendy', 'vintage'];

  return (
    <div className="space-y-6">
      {/* Header with Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Wardrobe</h2>
          <p className="text-gray-600">{wardrobe.length} items</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
          
          {/* Filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="all">All Types</option>
              {clothingTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 whitespace-nowrap"
          >
            {showAddForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Add Item Form - Keep existing form code */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Add New Item</h3>
          
          <form onSubmit={handleAddItem} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo
              </label>
              <ImageUpload
                onImageUploaded={handleImageUpload}
                currentImage={newItem.image_url}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Blue Denim Jacket"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={newItem.type}
                  onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select type</option>
                  <option value="shirt">Shirt</option>
                  <option value="t-shirt">T-Shirt</option>
                  <option value="blouse">Blouse</option>
                  <option value="sweater">Sweater</option>
                  <option value="jacket">Jacket</option>
                  <option value="coat">Coat</option>
                  <option value="pants">Pants</option>
                  <option value="jeans">Jeans</option>
                  <option value="shorts">Shorts</option>
                  <option value="skirt">Skirt</option>
                  <option value="dress">Dress</option>
                  <option value="shoes">Shoes</option>
                  <option value="sneakers">Sneakers</option>
                  <option value="boots">Boots</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={newItem.color}
                  onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Navy Blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style
                </label>
                <select
                  value={newItem.style}
                  onChange={(e) => setNewItem({...newItem, style: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select style</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="business">Business</option>
                  <option value="sporty">Sporty</option>
                  <option value="elegant">Elegant</option>
                  <option value="bohemian">Bohemian</option>
                  <option value="vintage">Vintage</option>
                  <option value="trendy">Trendy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season
                </label>
                <select
                  value={newItem.season}
                  onChange={(e) => setNewItem({...newItem, season: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All seasons</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                  <option value="winter">Winter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={newItem.brand}
                  onChange={(e) => setNewItem({...newItem, brand: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Zara, H&M"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fabric
                </label>
                <input
                  type="text"
                  value={newItem.fabric}
                  onChange={(e) => setNewItem({...newItem, fabric: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Cotton, Wool, Polyester"
                />
              </div>
            </div>

            {/* Mood Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {moodTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleMoodTagsChange(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      newItem.mood_tags.includes(tag)
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{loading ? 'Adding...' : 'Add Item'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enhanced Wardrobe Grid with Edit/Delete Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredWardrobe.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="aspect-square bg-gray-100 relative">
              {item.image_url ? (
                <img
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <PhotoIcon className="h-16 w-16" />
                </div>
              )}
              
              {/* Clean/Dirty Status - Clickable */}
              <button
                onClick={() => handleToggleClean(item.id)}
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                  item.is_clean 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
                title={`Click to mark as ${item.is_clean ? 'dirty' : 'clean'}`}
              >
                {item.is_clean ? (
                  <><CheckCircleIcon className="h-3 w-3 inline mr-1" />Clean</>
                ) : (
                  <><XCircleIcon className="h-3 w-3 inline mr-1" />Dirty</>
                )}
              </button>

              {/* Action Buttons - Show on Hover */}
              <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-md transition-all hover:scale-105"
                  title="Edit item"
                >
                  <PencilIcon className="h-4 w-4 text-indigo-600" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-md transition-all hover:scale-105"
                  title="Delete item"
                >
                  <TrashIcon className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-1 truncate">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.type} • {item.color}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{item.brand || 'No brand'}</span>
                <span className="capitalize">{item.season}</span>
              </div>
              
              {item.mood_tags && item.mood_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.mood_tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.mood_tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{item.mood_tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredWardrobe.length === 0 && !loading && (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'No items match your filters' : 'Your wardrobe is empty'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Add some clothes to start getting outfit suggestions!'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Add Your First Item
            </button>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditItem}
          loading={loading}
        />
      )}
    </div>
  );
};

export default WardrobeManager;