import React, { useEffect } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const UsageAnalytics = () => {
  const { 
    usageAnalytics, 
    fetchUsageAnalytics, 
    analyticsLoading 
  } = useWardrobeStore();

  useEffect(() => {
    if (!usageAnalytics) {
      fetchUsageAnalytics();
    }
  }, [usageAnalytics, fetchUsageAnalytics]);

  if (analyticsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Crunching your style data...</span>
      </div>
    );
  }

  if (!usageAnalytics) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">
          Building Your Style Analytics
        </h3>
        <p className="mb-4">
          Save more outfits to see detailed usage patterns and insights!
        </p>
      </div>
    );
  }

  const { 
    most_worn_items, 
    least_worn_items, 
    best_value_items, 
    worst_value_items,
    color_preferences, 
    mood_preferences, 
    wardrobe_value, 
    efficiency_metrics 
  } = usageAnalytics;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📊 Usage Analytics</h2>
        <p>Deep insights into your wardrobe patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Utilization Rate</p>
              <p className="text-2xl font-bold">{efficiency_metrics?.utilization_rate || 0}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Avg Cost/Wear</p>
              <p className="text-2xl font-bold">${wardrobe_value?.average_cost_per_wear || 0}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Wears</p>
              <p className="text-2xl font-bold">{wardrobe_value?.total_wears || 0}</p>
            </div>
            <TrophyIcon className="h-8 w-8 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Outfits/Week</p>
              <p className="text-2xl font-bold">{efficiency_metrics?.outfits_per_week || 0}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 opacity-50" />
          </div>
        </div>
      </div>

      {/* Most & Least Worn Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">🏆 Most Worn Items</h3>
          </div>
          {most_worn_items && most_worn_items.length > 0 ? (
            <div className="space-y-3">
              {most_worn_items.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg">
                  <div className="text-yellow-600 dark:text-yellow-400 font-bold text-sm">#{index + 1}</div>
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{item.type}</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm">{item.wear_count} wears</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm">Save some outfits to see your favorites!</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">💤 Underused Items</h3>
          </div>
          {least_worn_items && least_worn_items.length > 0 ? (
            <div className="space-y-3">
              {least_worn_items.map(item => (
                <div key={item.id} className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{item.type}</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">Never worn - try it next!</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm">Great! You're using all your clothes well.</p>}
        </div>
      </div>

      {/* Cost Per Wear Analysis */}
      {best_value_items && best_value_items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">💚 Best Value Items</h3>
            </div>
            <div className="space-y-3">
              {best_value_items.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{item.type}</div>}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs">{item.wear_count} wears</div>
                    </div>
                  </div>
                  <div className="text-green-600 dark:text-green-400 font-bold">${item.cost_per_wear}</div>
                </div>
              ))}
            </div>
          </div>

          {worst_value_items && worst_value_items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">💸 Needs More Love</h3>
              </div>
              <div className="space-y-3">
                {worst_value_items.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{item.type}</div>}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs">{item.wear_count} wears</div>
                      </div>
                    </div>
                    <div className="text-red-600 dark:text-red-400 font-bold">${item.cost_per_wear}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Color & Mood Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {color_preferences && Object.keys(color_preferences).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold mb-4">🎨 Color Preferences</h3>
            <div className="space-y-2">
              {Object.entries(color_preferences).slice(0, 5).map(([color, count]) => (
                <div key={color} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: color.toLowerCase() }}></div>
                    <span className="text-sm capitalize">{color}</span>
                  </div>
                  <span className="text-sm">{count} wears</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mood_preferences && Object.keys(mood_preferences).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold mb-4">😊 Mood Patterns</h3>
            <div className="space-y-2">
              {Object.entries(mood_preferences).map(([mood, count]) => (
                <div key={mood} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{mood}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(count / Math.max(...Object.values(mood_preferences))) * 100}%` }}></div>
                    </div>
                    <span className="text-sm">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Wardrobe Value Summary */}
      {wardrobe_value && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-4">💰 Investment Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">${wardrobe_value.total_cost}</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Investment</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{wardrobe_value.total_wears}</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Wears</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">${wardrobe_value.average_cost_per_wear}</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Avg Cost/Wear</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{efficiency_metrics?.utilization_rate}%</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Efficiency</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageAnalytics;