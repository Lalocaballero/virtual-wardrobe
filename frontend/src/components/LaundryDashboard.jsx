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
      console.log('Items marked as washed!');
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  if (laundryLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3">Loading laundry insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🧺 Smart Laundry Assistant</h2>
        <p>Keep your wardrobe fresh and organized</p>
      </div>

      {/* Wardrobe Health Score */}
      {wardrobeHealth && (
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg shadow-sm border border-fog dark:border-inkwell p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-800 mb-4">
              <span className={`text-2xl font-bold ${getHealthScoreColor(wardrobeHealth.score)}`}>
                {wardrobeHealth.score}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Wardrobe Health Score</h3>
            <p className="mb-4">{wardrobeHealth.message}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{wardrobeHealth.clean_items}</div>
                <div>Clean Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{wardrobeHealth.items_needing_wash}</div>
                <div>Need Washing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{wardrobeHealth.total_items}</div>
                <div>Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{wardrobeHealth.clean_percentage}%</div>
                <div>Clean Rate</div>
              </div>
            </div>

            {wardrobeHealth.recommendations && wardrobeHealth.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                {wardrobeHealth.recommendations.map((rec, index) => (
                  <div key={index} className="bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm p-2 rounded-lg">
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
        <div className="bg-red-50 dark:bg-dark-subtle border border-red-200 dark:border-red-500/50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-destructive dark:text-destructive" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">
              Urgent: Items Need Washing Now!
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {laundryAlerts.urgent_items.map(item => (
              <div key={item.id} className="bg-card dark:bg-dark-subtle dark:bg-inkwell/50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{item.name}</h4>
                  <span className="text-xs px-2 py-1 bg-destructive/10 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full">
                    {item.wear_count_since_wash} wears
                  </span>
                </div>
                <p className="text-sm">{item.type} • {item.color}</p>
                {item.last_worn && <p className="text-xs mt-1">Last worn: {new Date(item.last_worn).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
          
          <button onClick={() => handleMarkWashed(laundryAlerts.urgent_items.map(item => item.id))} className="btn btn-danger">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            <span>Mark All as Washed</span>
          </button>
        </div>
      )}

      {/* Laundry Load Suggestions */}
      {laundryAlerts?.laundry_suggestions && laundryAlerts.laundry_suggestions.length > 0 && (
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg shadow-sm border border-fog dark:border-inkwell p-6">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-6 w-6 text-secondary dark:text-secondary" />
            <h3 className="text-lg font-semibold">Smart Laundry Loads</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {laundryAlerts.laundry_suggestions.map((load, index) => (
              <div key={index} className="border border-fog dark:border-inkwell rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{load.load_type}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      load.priority === 'high' ? 'bg-destructive/10 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}>
                      {load.priority} priority
                    </span>
                    <span className="text-sm">{load.count} items</span>
                  </div>
                </div>
                
                <div className="text-sm mb-3">
                  <p>Temperature: <span className="font-medium">{load.temperature}</span></p>
                  {load.special_care && <p className="text-orange-600 dark:text-orange-400">⚠️ Requires special care</p>}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {load.items.slice(0, 3).map(item => (
                    <span key={item.id} className="px-2 py-1 bg-muted dark:bg-inkwell text-xs rounded">
                      {item.name}
                    </span>
                  ))}
                  {load.items.length > 3 && <span className="px-2 py-1 bg-muted dark:bg-inkwell text-xs rounded">+{load.items.length - 3} more</span>}
                </div>
                
                <button onClick={() => handleMarkWashed(load.items.map(item => item.id))} className="w-full text-sm btn btn-primary">
                  Start This Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Priority Items */}
      {laundryAlerts?.high_priority && laundryAlerts.high_priority.length > 0 && (
        <div className="bg-orange-50 dark:bg-dark-subtle border border-orange-200 dark:border-orange-500/50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">
              High Priority ({laundryAlerts.high_priority.length} items)
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {laundryAlerts.high_priority.map(item => (
              <div key={item.id} className="bg-card dark:bg-dark-subtle dark:bg-inkwell/50 rounded-lg p-3 text-center">
                <div className="text-sm font-medium mb-1">{item.name}</div>
                <div className="text-xs">{item.type}</div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">{item.wear_count_since_wash} wears</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Items (Forgotten) */}
      {laundryAlerts?.overdue_items && laundryAlerts.overdue_items.length > 0 && (
        <div className="bg-blue-50 dark:bg-dark-subtle border border-blue-200 dark:border-blue-500/50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BoltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
              Forgotten Items ({laundryAlerts.overdue_items.length} items)
            </h3>
          </div>
          <p className="text-blue-800 dark:text-blue-300 mb-4">
            These items haven't been worn in over 30 days. Consider incorporating them into your outfits!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {laundryAlerts.overdue_items.slice(0, 8).map(item => (
              <div key={item.id} className="bg-card dark:bg-dark-subtle dark:bg-inkwell/50 rounded-lg p-3 text-center">
                <div className="text-sm font-medium mb-1">{item.name}</div>
                <div className="text-xs">{item.type} • {item.color}</div>
                {item.last_worn && <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{Math.floor((new Date() - new Date(item.last_worn)) / (1000 * 60 * 60 * 24))} days ago</div>}
              </div>
            ))}
          </div>
          {laundryAlerts.overdue_items.length > 8 && <p className="text-center text-blue-600 dark:text-blue-400 text-sm mt-3">+{laundryAlerts.overdue_items.length - 8} more items</p>}
        </div>
      )}

      {/* All Good State */}
      {laundryAlerts && !laundryAlerts.urgent_items?.length && !laundryAlerts.high_priority?.length && wardrobeHealth?.score >= 90 && (
        <div className="bg-green-50 dark:bg-dark-subtle border border-green-200 dark:border-green-500/50 rounded-lg p-6 text-center">
          <FaceSmileIcon className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
            Excellent Wardrobe Management! 🎉
          </h3>
          <p className="text-green-800 dark:text-green-300">
            Your clothes are well-maintained and your wardrobe is in great shape. Keep it up!
          </p>
        </div>
      )}
    </div>
  );
};

export default LaundryDashboard;