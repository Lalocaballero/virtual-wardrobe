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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Edit Item</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">Photo</label>
            <ImageUpload
              onImageUploaded={handleImageUpload}
              currentImage={formData.image_url}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Item Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full"
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
              <label className="block text-sm font-medium mb-2">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Style</label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({...formData, style: e.target.value})}
                className="w-full"
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
              <label className="block text-sm font-medium mb-2">Season</label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({...formData, season: e.target.value})}
                className="w-full"
              >
                <option value="all">All seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fabric</label>
              <input
                type="text"
                value={formData.fabric}
                onChange={(e) => setFormData({...formData, fabric: e.target.value})}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
                className="w-full"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_clean}
                onChange={(e) => setFormData({...formData, is_clean: e.target.checked})}
              />
              <span className="ml-2 text-sm">Item is clean</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mood Tags</label>
            <div className="flex flex-wrap gap-2">
              {moodTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleMoodTagsChange(tag)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    formData.mood_tags.includes(tag)
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;