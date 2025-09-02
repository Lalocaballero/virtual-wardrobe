import React, { useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/solid';

const FeedbackModal = ({ packingList, onClose, onSubmit, onSkip }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [unusedItems, setUnusedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUnusedItemToggle = (itemId) => {
    setUnusedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    const feedbackData = {
      rating,
      comments,
      unused_items: unusedItems,
    };
    await onSubmit(feedbackData);
    setLoading(false);
  };

  const handleSkip = async () => {
    setLoading(true);
    await onSkip();
    setLoading(false);
  }

  if (!packingList) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-fog dark:border-inkwell">
          <h2 className="text-xl font-semibold">How was your trip?</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted dark:hover:bg-inkwell">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <h3 className="font-medium mb-2 text-gray-800 dark:text-cloud-white">1. How would you rate this packing list?</h3>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`h-8 w-8 cursor-pointer ${
                    (hoverRating || rating) >= star
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-slate'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-gray-800 dark:text-cloud-white">2. Which items did you not use?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-background dark:bg-inkwell/50 rounded-md">
              {packingList.items.map(item => (
                <label key={item.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted dark:hover:bg-gray-600/50">
                  <input
                    type="checkbox"
                    checked={unusedItems.includes(item.id)}
                    onChange={() => handleUnusedItemToggle(item.id)}
                    className="h-4 w-4 rounded-md border-fog text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{item.item_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-gray-800 dark:text-cloud-white">3. Any other comments?</h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full input-form"
              rows="4"
              placeholder="e.g., The list was great, but I wish it included more formal options."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-fog dark:border-inkwell">
          <button type="button" onClick={handleSkip} disabled={loading} className="btn btn-secondary">
            {loading ? '...' : 'Skip & Complete Trip'}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="btn btn-primary"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
