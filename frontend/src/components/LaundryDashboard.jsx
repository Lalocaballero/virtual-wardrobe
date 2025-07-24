import React, { useEffect } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon,
  SparklesIcon,
  FaceSmileIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const LaundryDashboard = () => {
  const { 
    laundryAlerts, 
    wardrobeHealth, 
    fetchLaundryAlerts, 
    fetchWardrobeHealth,
    markItemsWashed,
    laundryLoading 
  } = useWardrobeStore();

  useEffect(() => {
    fetchLaundryAlerts();
    fetchWardrobeHealth();
  }, [fetchLaundryAlerts, fetchWardrobeHealth]);

  const handleMarkWashed = async (itemIds) => {
    const success = await markItemsWashed(itemIds);
    if (success) {
      // Show success message or notification
      console.log('Items marked as washed!');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (laundryLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading laundry insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🧺 Smart Laundry Assistant</h2>
        <p className="text-gray-600 dark:text-gray-400">Keep your wardrobe fresh and organized</p>
      </div>

      {/* Wardrobe Health Score */}
      {wardrobeHealth && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
              <span className={`text-2xl font-bold ${getHealthScoreColor(wardrobeHealth.score)}`}>
                {wardrobeHealth.score}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-gray-100">Wardrobe Health Score</h3>
            <p className="text-gray-600 mb-4 dark:text-gray-400">{wardrobeHealth.message}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{wardrobeHealth.clean_items}</div>
                <div className="text-gray-500">Clean Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{wardrobeHealth.items_needing_wash}</div>
                <div className="text-gray-500">Need Washing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{wardrobeHealth.total_items}</div>
                <div className="text-gray-500">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{wardrobeHealth.clean_percentage}%</div>
                <div className="text-gray-500">Clean Rate</div>
              </div>
            </div>

            {wardrobeHealth.recommendations && wardrobeHealth.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                {wardrobeHealth.recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 text-blue-800 text-sm p-2 rounded-lg">
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Urgent Items Alert */}
      {laundryAlerts?.urgent_items && laundryAlerts.urgent_items.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">
              Urgent: Items Need Washing Now!
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {laundryAlerts.urgent_items.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    {item.wear_count_since_wash} wears
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.type} • {item.color}</p>
                {item.last_worn && (
                  <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    Last worn: {new Date(item.last_worn).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={() => handleMarkWashed(laundryAlerts.urgent_items.map(item => item.id))}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>Mark All as Washed</span>
          </button>
        </div>
      )}

      {/* Laundry Load Suggestions */}
      {laundryAlerts?.laundry_suggestions && laundryAlerts.laundry_suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Smart Laundry Loads</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {laundryAlerts.laundry_suggestions.map((load, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">{load.load_type}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      load.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {load.priority} priority
                    </span>
                    <span className="text-sm text-gray-600">{load.count} items</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <p>Temperature: <span className="font-medium">{load.temperature}</span></p>
                  {load.special_care && (
                    <p className="text-orange-600 dark:text-gray-400">⚠️ Requires special care</p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {load.items.slice(0, 3).map(item => (
                    <span key={item.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {item.name}
                    </span>
                  ))}
                  {load.items.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      +{load.items.length - 3} more
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleMarkWashed(load.items.map(item => item.id))}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-gray-600 text-sm"
                >
                  Start This Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Priority Items */}
      {laundryAlerts?.high_priority && laundryAlerts.high_priority.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ClockIcon className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900 dark:text-gray-100">
              High Priority ({laundryAlerts.high_priority.length} items)
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {laundryAlerts.high_priority.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-3 text-center">
                <div className="text-sm font-medium text-gray-900 mb-1">{item.name}</div>
                <div className="text-xs text-gray-600">{item.type}</div>
                <div className="text-xs text-orange-600 mt-1">
                  {item.wear_count_since_wash} wears
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Items (Haven't worn in 30+ days) */}
      {laundryAlerts?.overdue_items && laundryAlerts.overdue_items.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BoltIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-gray-100">
              Forgotten Items ({laundryAlerts.overdue_items.length} items)
            </h3>
          </div>
          
          <p className="text-blue-800 mb-4 dark:text-gray-400">
            These items haven't been worn in over 30 days. Consider incorporating them into your outfits!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {laundryAlerts.overdue_items.slice(0, 8).map(item => (
              <div key={item.id} className="bg-white rounded-lg p-3 text-center">
                <div className="text-sm font-medium text-gray-900 mb-1">{item.name}</div>
                <div className="text-xs text-gray-600">{item.type} • {item.color}</div>
                {item.last_worn && (
                  <div className="text-xs text-blue-600 mt-1">
                    {Math.floor((new Date() - new Date(item.last_worn)) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {laundryAlerts.overdue_items.length > 8 && (
            <p className="text-center text-blue-600 text-sm mt-3 dark:text-gray-400">
              +{laundryAlerts.overdue_items.length - 8} more items
            </p>
          )}
        </div>
      )}

      {/* All Good State */}
      {laundryAlerts && 
       !laundryAlerts.urgent_items?.length && 
       !laundryAlerts.high_priority?.length && 
       wardrobeHealth?.score >= 90 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <FaceSmileIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2 dark:text-gray-100">
            Excellent Wardrobe Management! 🎉
          </h3>
          <p className="text-green-800 dark:text-gray-400">
            Your clothes are well-maintained and your wardrobe is in great shape. Keep it up!
          </p>
        </div>
      )}
    </div>
  );
};

export default LaundryDashboard;