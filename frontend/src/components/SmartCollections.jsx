import React, { useEffect } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { 
  BriefcaseIcon, 
  HeartIcon, 
  SunIcon, 
  StarIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const SmartCollections = () => {
  const { 
    smartCollections, 
    fetchSmartCollections, 
    intelligenceLoading 
  } = useWardrobeStore();

  useEffect(() => {
    // Only fetch if the collections haven't been loaded yet.
    if (!smartCollections || Object.keys(smartCollections).length === 0) {
      fetchSmartCollections();
    }
  }, [smartCollections, fetchSmartCollections]);

  const getCollectionIcon = (collectionId) => {
    const iconMap = {
      work: BriefcaseIcon,
      casual: SunIcon,
      special: HeartIcon,
      active: SparklesIcon,
      seasonal: ClockIcon,
      favorites: StarIcon,
      underused: ClockIcon
    };
    return iconMap[collectionId] || SparklesIcon;
  };

  const getCollectionGradient = (collectionId) => {
    const gradientMap = {
      work: 'from-blue-500 to-indigo-600',
      casual: 'from-green-500 to-teal-600',
      special: 'from-pink-500 to-rose-600',
      active: 'from-orange-500 to-red-600',
      seasonal: 'from-purple-500 to-indigo-600',
      favorites: 'from-yellow-500 to-orange-600',
      underused: 'from-gray-500 to-slate-600'
    };
    return gradientMap[collectionId] || 'from-indigo-500 to-purple-600';
  };

  if (intelligenceLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Analyzing your style patterns...</span>
      </div>
    );
  }

  if (!smartCollections || Object.keys(smartCollections).length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Building Your Smart Collections
        </h3>
        <p className="mb-4">
          Add more clothes and save some outfits to see intelligent collections!
        </p>
        <div className="bg-blue-50 dark:bg-gray-700/50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 Smart collections automatically organize your clothes by style, occasion, and usage patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🧠 Smart Collections</h2>
        <p>AI-organized wardrobe based on your style patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(smartCollections).map(([collectionId, collection]) => {
          const IconComponent = getCollectionIcon(collectionId);
          const gradient = getCollectionGradient(collectionId);
          
          return (
            <div key={collectionId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">{collection.name}</h3>
                    <p className="text-sm opacity-90">{collection.count} items</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm mb-4">{collection.description}</p>
                
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {collection.items.slice(0, 8).map(item => (
                    <div key={item.id} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                          {item.type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span>{collection.count} total items</span>
                  {collection.items.some(item => item.wear_count > 0) && (
                    <span>Avg. {Math.round(collection.items.reduce((sum, item) => sum + (item.wear_count || 0), 0) / collection.count)} wears</span>
                  )}
                </div>

                <button className="w-full mt-3 py-2 px-4 text-sm btn btn-secondary">
                  View All Items
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">🔍 Collection Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="font-medium text-indigo-700 dark:text-indigo-400">Most Active Collection</div>
            <div>
              {Object.entries(smartCollections).reduce((max, [id, collection]) => {
                const totalWears = collection.items.reduce((sum, item) => sum + (item.wear_count || 0), 0);
                return totalWears > (max.wears || 0) ? { id, name: collection.name, wears: totalWears } : max;
              }, {}).name || 'No data yet'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="font-medium text-indigo-700 dark:text-indigo-400">Largest Collection</div>
            <div>
              {Object.entries(smartCollections).reduce((max, [id, collection]) => 
                collection.count > (max.count || 0) ? { name: collection.name, count: collection.count } : max
              , {}).name || 'No data yet'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCollections;