import React, { useEffect } from 'react';
import { format } from 'date-fns';
import useWardrobeStore from '../store/wardrobeStore';
import { PhotoIcon } from '@heroicons/react/24/outline'; // It's good practice to import used icons

const OutfitHistory = () => {
  const { outfitHistory, fetchOutfitHistory, loading } = useWardrobeStore();

  useEffect(() => {
    fetchOutfitHistory();
  }, [fetchOutfitHistory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Outfit History</h2>
      
      {outfitHistory.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-2">
            No saved outfits yet
          </h3>
          <p>
            Generate and save some outfits to see them here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {outfitHistory.map(outfit => (
            <div key={outfit.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {format(new Date(outfit.date), 'MMMM d, yyyy')}
                  </h3>
                  <p>
                    {outfit.weather} • {outfit.mood} mood
                  </p>
                </div>
                <span className="text-sm">
                  {format(new Date(outfit.date), 'h:mm a')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {outfit.clothing_items?.map(item => (
                  <div key={item.id} className="text-center">
                    <div className="h-20 w-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-gray-400 dark:text-gray-500">
                           <PhotoIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs">{item.name}</p>
                  </div>
                ))}
              </div>
              
              {outfit.reason_text && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm">{outfit.reason_text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OutfitHistory;