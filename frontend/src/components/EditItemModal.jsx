import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ImageUpload from './ImageUpload';

const EditItemModal = ({ item, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    type: item?.type || '',
    color: item?.color || '',
    style: item?.style || '',
    season: item?.season || 'all',
    brand: item?.brand || '',
    fabric: item?.fabric || '',
    condition: item?.condition || 'good',
    is_clean: item?.is_clean ?? true,
    mood_tags: item?.mood_tags || [],
    image_url: item?.image_url || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(item.id, formData);
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  const handleMoodTagsChange = (tag) => {
    setFormData(prev => ({
      ...prev,
      mood_tags: prev.mood_tags.includes(tag)
        ? prev.mood_tags.filter(t => t !== tag)
        : [...prev.mood_tags, tag]
    }));
  };

  const moodTags = ['casual', 'formal', 'sporty', 'cozy', 'elegant', 'trendy', 'vintage'];

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <ImageUpload
              onImageUploaded={handleImageUpload}
              currentImage={formData.image_url}
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
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({...formData, style: e.target.value})}
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
                value={formData.season}
                onChange={(e) => setFormData({...formData, season: e.target.value})}
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
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fabric
              </label>
              <input
                type="text"
                value={formData.fabric}
                onChange={(e) => setFormData({...formData, fabric: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          {/* Clean Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_clean}
                onChange={(e) => setFormData({...formData, is_clean: e.target.checked})}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Item is clean</span>
            </label>
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
                    formData.mood_tags.includes(tag)
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:hover:bg-gray-600'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;