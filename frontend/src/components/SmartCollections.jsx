import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  const getCollectionColors = (collectionId) => {
    const colorMap = {
      work: 'bg-secondary text-secondary-foreground',
      casual: 'bg-green-500 text-white', // Using green as a positive color
      special: 'bg-primary text-primary-foreground',
      active: 'bg-accent text-accent-foreground',
      seasonal: 'bg-blue-500 text-white', // Using blue for seasonal
      favorites: 'bg-yellow-400 text-black',
      underused: 'bg-slate text-white'
    };
    return colorMap[collectionId] || 'bg-secondary text-secondary-foreground';
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
      <div className="text-center py-12 bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg border border-fog dark:border-inkwell">
        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-slate mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Getting to know your style...
        </h3>
        <p className="mb-4">
          Add some more clothes and log a few outfits. We'll handle the rest.
        </p>
        <div className="bg-secondary/10 dark:bg-secondary/20 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-secondary-foreground/80">
            💡 Smart collections automatically organize your clothes by style, occasion, and usage patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2">🧠 Smart Collections</h2>
        <p>Your wardrobe, but smarter. We've organized your clothes into collections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(smartCollections).map(([collectionId, collection]) => {
          const IconComponent = getCollectionIcon(collectionId);
          const colors = getCollectionColors(collectionId);
          
          return (
            <div key={collectionId} className="bg-card dark:bg-dark-subtle rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`${colors} p-4`}>
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
                    <div key={item.id} className="aspect-square bg-muted dark:bg-inkwell rounded-lg overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate dark:text-dark-text-secondary">
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

                <Link to={`/collections?collection=${collectionId}`} className="w-full mt-3 py-2 px-4 text-sm btn btn-secondary text-center">
                  View All Items
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-secondary/10 dark:bg-secondary/20 rounded-lg p-6 border border-secondary/20">
        <h3 className="font-semibold text-secondary-foreground mb-3">🔍 Collection Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-card dark:bg-dark-subtle rounded-lg p-3">
            <div className="font-medium text-secondary">Most Active Collection</div>
            <div>
              {Object.entries(smartCollections).reduce((max, [id, collection]) => {
                const totalWears = collection.items.reduce((sum, item) => sum + (item.wear_count || 0), 0);
                return totalWears > (max.wears || 0) ? { id, name: collection.name, wears: totalWears } : max;
              }, {}).name || 'No data yet'}
            </div>
          </div>
          <div className="bg-card dark:bg-dark-subtle rounded-lg p-3">
            <div className="font-medium text-secondary">Largest Collection</div>
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