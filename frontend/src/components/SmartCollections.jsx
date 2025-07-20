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

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const backendRootUrl = API_BASE.replace('/api', '');

const SmartCollections = () => {
  const { 
    smartCollections, 
    fetchSmartCollections, 
    intelligenceLoading 
  } = useWardrobeStore();

  useEffect(() => {
    fetchSmartCollections();
  }, [fetchSmartCollections]);

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
        <span className="ml-3 text-gray-600">Analyzing your style patterns...</span>
      </div>
    );
  }

  if (!smartCollections || Object.keys(smartCollections).length === 0) {
    return (
      <div className="text-center py-12">
        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Building Your Smart Collections
        </h3>
        <p className="text-gray-600 mb-4">
          Add more clothes and save some outfits to see intelligent collections!
        </p>
        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            💡 Smart collections automatically organize your clothes by style, occasion, and usage patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🧠 Smart Collections</h2>
        <p className="text-gray-600">AI-organized wardrobe based on your style patterns</p>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(smartCollections).map(([collectionId, collection]) => {
          const IconComponent = getCollectionIcon(collectionId);
          const gradient = getCollectionGradient(collectionId);
          
          return (
            <div key={collectionId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Collection Header */}
              <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">{collection.name}</h3>
                    <p className="text-sm opacity-90">{collection.count} items</p>
                  </div>
                </div>
              </div>

              {/* Collection Content */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">{collection.description}</p>
                
                {/* Item Preview Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {collection.items.slice(0, 8).map(item => (
                    <div key={item.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {item.type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Collection Stats */}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{collection.count} total items</span>
                  {collection.items.some(item => item.wear_count > 0) && (
                    <span>
                      Avg. {Math.round(
                        collection.items.reduce((sum, item) => sum + (item.wear_count || 0), 0) / collection.count
                      )} wears
                    </span>
                  )}
                </div>

                {/* Quick Action */}
                <button className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm transition-colors">
                  View All Items
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collections Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 mb-3">🔍 Collection Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="text-indigo-700 font-medium">Most Active Collection</div>
            <div className="text-gray-600">
              {Object.entries(smartCollections).reduce((max, [id, collection]) => {
                const totalWears = collection.items.reduce((sum, item) => sum + (item.wear_count || 0), 0);
                return totalWears > (max.wears || 0) ? { id, name: collection.name, wears: totalWears } : max;
              }, {}).name || 'No data yet'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-indigo-700 font-medium">Largest Collection</div>
            <div className="text-gray-600">
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