import React from 'react';
import useWardrobeStore from '../store/wardrobeStore';

const OutfitGenerator = ({ outfit, mood }) => {
  const { saveOutfit, generateOutfit, loading } = useWardrobeStore();

  const handleSaveOutfit = () => {
    if (outfit && outfit.items.length > 0) {
      const outfitData = {
        item_ids: outfit.items.map(item => item.id),
        weather: outfit.weather,
        mood: outfit.mood,
        reason_text: outfit.suggestion?.reasoning || ''
      };
      saveOutfit(outfitData);
    }
  };

  const handleGenerateAnother = () => {
    if (outfit && outfit.items) {
      const exclude_ids = outfit.items.map(item => item.id);
      generateOutfit(mood, exclude_ids);
    } else {
      generateOutfit(mood);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-48 md:h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 mt-3 text-center">Whipping up a look for you...</span>
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="text-center py-8 md:py-12 px-4">
        <div className="mb-6">
          <div className="mx-auto h-20 w-20 md:h-24 md:w-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4">
            <svg className="h-10 w-10 md:h-12 md:w-12 text-secondary dark:text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-medium mb-4">
            Your next great look is just a click away.
          </h3>
          <p className="mb-6 text-sm md:text-base">
            Pick a mood, and we'll work our magic.
          </p>
        </div>
        <div className="bg-accent/10 dark:bg-accent/20 border border-accent/20 rounded-lg p-4 md:p-6 max-w-md mx-auto">
          <p className="text-sm text-accent-foreground font-medium mb-2">💡 Pro Tips:</p>
          <ul className="text-sm text-accent-foreground/80 space-y-1 text-left">
            <li>• Add photos to your wardrobe items</li>
            <li>• Set your location for weather-based suggestions</li>
            <li>• Try different moods for variety</li>
            <li>• Keep your clothes marked as clean</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Weather & Mood Info */}
      <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg shadow-sm border border-fog dark:border-inkwell p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <h2 className="text-4xl font-bold mb-2">Today's Outfit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-sm">
              <div>
                <span className="font-medium">Weather:</span> {outfit.weather}
              </div>
              <div>
                <span className="font-medium">Mood:</span> {outfit.mood}
              </div>
              {outfit.weather_advice && (
                <div className="sm:col-span-2">
                  <span className="font-medium">Weather Advice:</span> 
                  <span className="text-xs md:text-sm"> {outfit.weather_advice}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button onClick={handleGenerateAnother} disabled={loading} className="flex-1 sm:flex-none btn btn-secondary">
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
              <span>Suggest Another</span>
            </button>
            <button onClick={handleSaveOutfit} className="flex-1 sm:flex-none btn btn-primary">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Wear it! ✨</span>
            </button>
          </div>
        </div>
      </div>

      {/* Outfit Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {outfit.items?.map(item => (
          <div key={item.id} className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg shadow-sm border border-fog dark:border-inkwell overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-muted dark:bg-inkwell relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-slate">
                  <svg className="h-8 w-8 md:h-16 md-w-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                </div>
              )}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-card dark:bg-dark-subtle/80 dark:bg-gray-900/70 backdrop-blur-sm rounded text-xs font-medium">
                {item.type}
              </div>
              <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-medium ${item.is_clean ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-red-800'}`}>
                {item.is_clean ? '✓' : '!'}
              </div>
            </div>
            
            <div className="p-2 md:p-4">
              <h3 className="font-medium mb-1 truncate text-sm md:text-base">{item.name}</h3>
              <div className="text-xs md:text-sm space-y-1">
                <p>{item.color} • {item.style || 'No style'}</p>
                <p className="truncate">{item.brand || 'No brand'}</p>
              </div>
              
              {item.mood_tags && item.mood_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.mood_tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-secondary/10 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {item.mood_tags.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-muted dark:bg-inkwell text-xs rounded">
                      +{item.mood_tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Reasoning */}
      {outfit.suggestion && (
        <div className="space-y-3 md:space-y-4">
          {outfit.suggestion.reasoning && (
            <div className="bg-secondary/10 dark:bg-secondary/20 border border-secondary/20 rounded-lg p-4 md:p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-secondary-foreground mb-2 text-sm md:text-base">Here's the style breakdown:</h3>
                  <p className="text-secondary-foreground/80 leading-relaxed text-sm md:text-base">{outfit.suggestion.reasoning}</p>
                </div>
              </div>
            </div>
          )}
          
          {outfit.suggestion.style_notes && (
            <div className="bg-accent/10 dark:bg-accent/20 border border-accent/20 rounded-lg p-4 md:p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-accent-foreground mb-2 text-sm md:text-base">Pro tip:</h3>
                  <p className="text-accent-foreground/80 leading-relaxed text-sm md:text-base">{outfit.suggestion.style_notes}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm">
              <span>AI Confidence:</span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 md:h-4 md:w-4 ${ i < Math.round((outfit.suggestion?.confidence || 0.5) * 5) ? 'text-yellow-400' : 'text-gray-300 dark:text-slate' }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  ><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
                <span className="ml-1 text-xs">({Math.round((outfit.suggestion?.confidence || 0.5) * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitGenerator;