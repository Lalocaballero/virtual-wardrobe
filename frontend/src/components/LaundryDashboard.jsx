import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWardrobeStore from '../store/wardrobeStore';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon,
  SparklesIcon,
  FaceSmileIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const LockedSmartLoads = () => {
  const { showUpgradeModal, profile } = useWardrobeStore();
  
  const constructCheckoutUrl = () => {
    if (!profile) return '';
    const productId = process.env.REACT_APP_LEMONSQUEEZY_PRODUCT_ID;
    const baseUrl = `https://wewear.lemonsqueezy.com/buy/${productId}`;
    const params = new URLSearchParams({
      'checkout[email]': profile.email,
      'checkout_data[custom][user_id]': profile.id,
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleCardClick = () => {
    const checkoutUrl = constructCheckoutUrl();
    if (checkoutUrl) {
      showUpgradeModal('laundry', {
        ctaText: 'Unlock Smart Loads',
        checkoutUrl: checkoutUrl,
      });
    }
  };

  return (
    <div 
      className="bg-card dark:bg-dark-subtle rounded-lg shadow-sm border border-fog dark:border-inkwell p-6 relative cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* The blurred, underlying content */}
      <div className="opacity-50 blur-sm">
        <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-6 w-6 text-secondary dark:text-secondary" />
            <h3 className="text-lg font-semibold">Smart Laundry Loads</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-fog dark:border-inkwell rounded-lg p-4">
                <h4 className="font-medium">Darks</h4>
            </div>
            <div className="border border-fog dark:border-inkwell rounded-lg p-4">
                <h4 className="font-medium">Whites</h4>
            </div>
        </div>
      </div>
      
      {/* The overlay */}
      <div className="absolute inset-0 bg-gray-200 bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 flex flex-col items-center justify-center text-center p-4 transition-all duration-300 group-hover:bg-opacity-85">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-gray-600 dark:text-gray-400 mb-2">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Unlock Smart Laundry Loads</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Upgrade to Premium to let AI optimize your laundry.</p>
      </div>
    </div>
  );
};

const LaundryDashboard = () => {
  const navigate = useNavigate();
  const { 
    profile,
    fetchProfile,
    laundryAlerts, 
    wardrobeHealth, 
    fetchLaundryAlerts, 
    fetchWardrobeHealth,
    markItemsWashed,
    laundryLoading,
    showUpgradeModal
  } = useWardrobeStore();

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
    fetchLaundryAlerts();
    fetchWardrobeHealth();
  }, [profile, fetchProfile, fetchLaundryAlerts, fetchWardrobeHealth]);

  const handleMarkWashed = async (itemIds) => {
    const success = await markItemsWashed(itemIds);
    if (success) {
      console.log('Items marked as washed!');
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'text-green-500'; // Using green as a positive indicator
    if (score >= 75) return 'text-secondary';
    if (score >= 60) return 'text-accent';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  if (laundryLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3">Loading laundry insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2">🧺 Smart Laundry Assistant</h2>
        <p>Keep your wardrobe fresh and organized</p>
      </div>

      {/* Wardrobe Health Score */}
      {wardrobeHealth && (
        <div className="bg-card dark:bg-dark-subtle rounded-lg shadow-sm border border-fog dark:border-inkwell p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 mb-4">
              <span className={`text-2xl font-bold ${getHealthScoreColor(wardrobeHealth.score)}`}>
                {wardrobeHealth.score}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Wardrobe's Vibe Check</h3>
            <p className="mb-4">{wardrobeHealth.message}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{wardrobeHealth.clean_items}</div>
                <div>Clean Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{wardrobeHealth.items_needing_wash}</div>
                <div>Need Washing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{wardrobeHealth.total_items}</div>
                <div>Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{wardrobeHealth.clean_percentage}%</div>
                <div>Clean Rate</div>
              </div>
            </div>

            {wardrobeHealth.recommendations && wardrobeHealth.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                {wardrobeHealth.recommendations.map((rec, index) => (
                  <div key={index} className="bg-secondary/10 dark:bg-secondary/20 text-secondary-foreground text-sm p-2 rounded-lg">
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
        <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">
              Laundry Alert! These items are overdue for a spa day.
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            {laundryAlerts.urgent_items.map(item => (
              <div key={item.id} className="bg-card dark:bg-dark-subtle rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{item.name}</h4>
                  <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full">
                    {item.wear_count_since_wash} wears
                  </span>
                </div>
                <p className="text-sm">{item.type} • {item.color}</p>
                {item.last_worn && <p className="text-xs mt-1">Last worn: {new Date(item.last_worn).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
          
          <button onClick={() => handleMarkWashed(laundryAlerts.urgent_items.map(item => item.id))} className="btn btn-destructive">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            <span>Mark All as Washed</span>
          </button>
        </div>
      )}

      {/* Laundry Load Suggestions */}
      {profile?.is_premium ? (
        laundryAlerts?.laundry_suggestions && laundryAlerts.laundry_suggestions.length > 0 && (
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
                        load.priority === 'high' ? 'bg-destructive/10 text-destructive-foreground' : 'bg-accent/10 text-accent-foreground'
                      }`}>
                        {load.priority} priority
                      </span>
                      <span className="text-sm">{load.count} items</span>
                    </div>
                  </div>
                  
                  <div className="text-sm mb-3">
                    <p>Temperature: <span className="font-medium">{load.temperature}</span></p>
                    {load.special_care && <p className="text-warning">⚠️ Requires special care</p>}
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
        )
      ) : (
        <LockedSmartLoads />
      )}

      {/* High Priority Items */}
      {laundryAlerts?.high_priority && laundryAlerts.high_priority.length > 0 && (
        <div className="bg-accent/10 dark:bg-accent/20 border border-accent/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ClockIcon className="h-6 w-6 text-accent" />
            <h3 className="text-lg font-semibold text-accent-foreground">
              High Priority ({laundryAlerts.high_priority.length} items)
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {laundryAlerts.high_priority.map(item => (
              <div key={item.id} className="bg-card dark:bg-dark-subtle rounded-lg p-4 text-center">
                <div className="text-sm font-medium mb-1">{item.name}</div>
                <div className="text-xs">{item.type}</div>
                <div className="text-xs text-accent mt-1">{item.wear_count_since_wash} wears</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Items (Forgotten) */}
      {laundryAlerts?.overdue_items && laundryAlerts.overdue_items.length > 0 && (
        <div className="bg-secondary/10 dark:bg-secondary/20 border border-secondary/20 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BoltIcon className="h-6 w-6 text-secondary" />
            <h3 className="text-lg font-semibold text-secondary-foreground">
              Forgotten Items ({laundryAlerts.overdue_items.length} items)
            </h3>
          </div>
          <p className="text-secondary-foreground/80 mb-4">
            These items haven't been worn in over 30 days. Consider incorporating them into your outfits!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {laundryAlerts.overdue_items.slice(0, 8).map(item => (
              <div key={item.id} className="bg-card dark:bg-dark-subtle rounded-lg p-3 text-center">
                <div className="text-sm font-medium mb-1">{item.name}</div>
                <div className="text-xs">{item.type} • {item.color}</div>
                {item.last_worn && <div className="text-xs text-secondary mt-1">{Math.floor((new Date() - new Date(item.last_worn)) / (1000 * 60 * 60 * 24))} days ago</div>}
              </div>
            ))}
          </div>
          {laundryAlerts.overdue_items.length > 8 && <p className="text-center text-secondary text-sm mt-3">+{laundryAlerts.overdue_items.length - 8} more items</p>}
        </div>
      )}

      {/* All Good State */}
      {laundryAlerts && !laundryAlerts.urgent_items?.length && !laundryAlerts.high_priority?.length && wardrobeHealth?.score >= 90 && (
        <div className="bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 rounded-lg p-6 text-center">
          <FaceSmileIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-500 mb-2">
            Look at you! Your wardrobe is sparkling. ✨
          </h3>
          <p className="text-green-500/80">
            Not a laundry basket in sight. We love to see it.
          </p>
        </div>
      )}
    </div>
  );
};

export default LaundryDashboard;