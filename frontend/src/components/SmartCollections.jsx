import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import useWardrobeStore, { API_BASE } from '../store/wardrobeStore';
import { 
  BriefcaseIcon, 
  HeartIcon, 
  SunIcon, 
  StarIcon,
  ClockIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import hangerSpark from '../assets/hanger-spark.png';

const SmartCollections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const collectionSlug = searchParams.get('collection');
  
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(collectionSlug ? 'single' : 'all');
  const [error, setError] = useState(null);
  const { 
    smartCollections, 
    fetchSmartCollections, 
    intelligenceLoading,
    fetchApi
  } = useWardrobeStore();

  useEffect(() => {
    // Only fetch if the collections haven't been loaded yet.
    // smartCollections is intentionally omitted from the dependency array
    // to prevent an infinite loop. The check inside the effect handles this.
    if (!collectionSlug && (!smartCollections || Object.keys(smartCollections).length === 0)) {
      fetchSmartCollections();
    }
  }, [collectionSlug, fetchSmartCollections, smartCollections]);

  // Effect to fetch a single collection when the URL slug changes
  useEffect(() => {
    const fetchCollection = async (slug) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApi(`${API_BASE}/intelligence/collections/${slug}`);
        setSelectedCollection(data);
        setView('single');
        document.title = `WeWear. | Collection: ${data.name}`;
      } catch (err) {
        setError('Collection not found. It might be on a secret mission!');
        console.error("Failed to fetch collection:", err);
      } finally {
        setLoading(false);
      }
    };

    if (collectionSlug) {
      fetchCollection(collectionSlug);
    } else {
      setSelectedCollection(null);
      setView('all');
      document.title = 'WeWear. | Smart Collections';
    }
  }, [collectionSlug, fetchApi]);

  const handleSelectCollection = (slug) => {
    setSearchParams({ collection: slug });
  };

  const handleBackToAll = () => {
    setSearchParams({});
  };

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

  const SingleCollectionView = ({ collection, onBack }) => (
    <div className="transition-opacity duration-300">
      <button onClick={onBack} className="flex items-center text-sm mb-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to all collections
      </button>
      <h1 className="text-4xl font-bold mb-2 text-center">{collection.name}</h1>
      <p className="text-center text-slate dark:text-dark-text-secondary mb-8">{collection.description}</p>
  
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {collection.items.map(item => (
          <div key={item.id} className="bg-card dark:bg-dark-subtle rounded-lg shadow-md overflow-hidden group">
            <div className="aspect-square bg-muted dark:bg-inkwell overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate dark:text-dark-text-secondary">
                  {item.type}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold truncate text-sm">{item.name}</h3>
              <p className="text-xs text-slate dark:text-dark-text-secondary">{item.color} {item.style}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const AllCollectionsView = () => {
    const { profile, showUpgradeModal } = useWardrobeStore();
    const PREMIUM_COLLECTIONS = ['special', 'work', 'underused'];

    const constructCheckoutUrl = () => {
      if (!profile) return '';
      const productId = process.env.REACT_APP_LEMONSQUEEZY_PRODUCT_ID;
      const baseUrl = `https://wewear.lemonsqueezy.com/checkout/buy/${productId}`;
      const params = new URLSearchParams({
          'checkout[email]': profile.email,
          'checkout_data[custom][user_id]': profile.id,
      });
      return `${baseUrl}?${params.toString()}`;
    };

    const handleUpgradeClick = () => {
        const checkoutUrl = constructCheckoutUrl();
        if (checkoutUrl) {
            showUpgradeModal('smart_collections', {
                ctaText: 'Unlock Smart Collections',
                checkoutUrl: checkoutUrl,
            });
        }
    };

    if (intelligenceLoading && (!smartCollections || Object.keys(smartCollections).length === 0)) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3">Analyzing your style patterns...</span>
        </div>
      );
    }
  
    if (!smartCollections || Object.keys(smartCollections).length === 0) {
      return (
        <div className="text-center py-16">
            <img src={hangerSpark} alt="Smart Hanger Icon" className="mx-auto h-16 w-16 mb-4" />
            <h3 className="font-poppins font-bold text-xl text-gray-800 dark:text-white mb-2">
              Your wardrobe is full of potential.
            </h3>
            <p className="font-inter text-gray-500 dark:text-gray-400">
              Add a few items, and we'll start organizing them into smart collections for you!
            </p>
        </div>
      );
    }
  
    return (
      <div className="transition-opacity duration-300">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-2">🧠 Smart Collections</h2>
          <p className="text-slate dark:text-dark-text-secondary">Your wardrobe, but smarter. We've organized your clothes into collections.</p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Object.entries(smartCollections).map(([collectionId, collection]) => {
            const IconComponent = getCollectionIcon(collectionId);
            const colors = getCollectionColors(collectionId);
            const isPremium = PREMIUM_COLLECTIONS.includes(collectionId);

            if (isPremium && !profile?.is_premium) {
              return (
                <div 
                  key={collectionId}
                  className="bg-card dark:bg-dark-subtle rounded-lg shadow-md overflow-hidden relative cursor-pointer"
                  onClick={handleUpgradeClick}
                >
                  <div className="p-4 opacity-30">
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
                      <p className="text-sm mb-4 h-10">{collection.description}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gray-500/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-white">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              );
            }
            
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
                  <p className="text-sm mb-4 h-10">{collection.description}</p>
                  
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {collection.items.slice(0, 8).map(item => (
                      <div key={item.id} className="aspect-square bg-muted dark:bg-inkwell rounded-lg overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate dark:text-dark-text-secondary">{item.type}</div>
                        )}
                      </div>
                    ))}
                  </div>
  
                  <div className="mt-4 flex items-center justify-center gap-x-4">
                    <Link to={`/dashboard/outfit?collection=${collectionId}`} className="btn btn-primary text-sm font-bold" style={{backgroundColor: '#FF6B6B', color: 'white'}}>
                      Generate Outfit
                    </Link>
                    <button onClick={() => handleSelectCollection(collectionId)} className="btn btn-ghost text-sm" style={{color: '#7E7E9A', borderColor: '#7E7E9A'}}>
                      View All Items
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Gathering your collection...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium">{error}</h3>
        <button onClick={handleBackToAll} className="mt-4 btn btn-primary">Back to all collections</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div key={view} className="animate-fadeIn">
        {view === 'single' && selectedCollection ? (
          <SingleCollectionView collection={selectedCollection} onBack={handleBackToAll} />
        ) : (
          <AllCollectionsView onSelectCollection={handleSelectCollection} />
        )}
      </div>
    </div>
  );
};

export default SmartCollections;