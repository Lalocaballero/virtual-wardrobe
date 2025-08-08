import React from 'react';
import { XMarkIcon, CalendarIcon, SunIcon, CloudIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const OutfitDetailModal = ({ outfits, onClose }) => {
  if (!outfits || outfits.length === 0) return null;

  const firstOutfit = outfits[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            Outfits for {format(new Date(firstOutfit.date), 'MMMM d, yyyy')}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {outfits.map((outfit, index) => (
            <div key={outfit.id} className={index > 0 ? "pt-6 border-t border-gray-200 dark:border-gray-700" : ""}>
              <div className="flex flex-wrap gap-4 items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex items-center">
                  <SunIcon className="h-5 w-5 mr-2" />
                  <span>{outfit.weather || 'No weather info'}</span>
                </div>
                <div className="flex items-center">
                  <CloudIcon className="h-5 w-5 mr-2" />
                  <span className="capitalize">{outfit.mood || 'No mood specified'}</span>
                </div>
              </div>
              
              {outfit.reason_text && (
                <div className="p-3 mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm italic text-gray-600 dark:text-gray-300">"{outfit.reason_text}"</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-3">Items in this Outfit</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {outfit.clothing_items?.map(item => (
                    <div key={item.id} className="text-center">
                      <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <span className="text-xs text-center p-1">{item.name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm mt-2 font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutfitDetailModal;
