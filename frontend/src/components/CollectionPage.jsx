import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import useWardrobeStore, { API_BASE } from '../store/wardrobeStore';
import { SparklesIcon } from '@heroicons/react/24/outline';

const CollectionPage = () => {
  const [searchParams] = useSearchParams();
  const collectionSlug = searchParams.get('collection');
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchApi = useWardrobeStore(state => state.fetchApi);

  useEffect(() => {
    if (collectionSlug) {
      const fetchCollection = async () => {
        setLoading(true);
        try {
          const data = await fetchApi(`${API_BASE}/intelligence/collections/${collectionSlug}`);
          setCollection(data);
          document.title = `WeWear. | Collection: ${data.name}`;
        } catch (err) {
          setError('Collection not found. It might be on a secret mission!');
          console.error("Failed to fetch collection:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchCollection();
    } else {
      setError("No collection specified. Which one are you looking for?");
      setLoading(false);
    }
  }, [collectionSlug, fetchApi]);

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
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2 text-center">{collection.name}</h1>
      <p className="text-center text-slate mb-8">{collection.description}</p>

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
};

export default CollectionPage;
