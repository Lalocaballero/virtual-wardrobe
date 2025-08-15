import React, { useState, useEffect, useMemo } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { PlusIcon, TrashIcon, PencilIcon, ArrowLeftIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// A new component for the progress bar
const PackingProgressBar = ({ items }) => {
    const totalItems = items.length;
    const packedItems = items.filter(item => item.is_packed).length;
    const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 my-4">
            <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};


const PackingAssistant = () => {
  const { 
    trips, 
    fetchTrips, 
    createTrip, 
    deleteTrip, 
    tripsLoading,
    fetchPackingList,
    togglePackedItem,
    completeTrip,
    currentTripPackingList 
  } = useWardrobeStore();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [newTrip, setNewTrip] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    trip_type: 'vacation',
    notes: ''
  });

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    if (selectedTrip) {
      fetchPackingList(selectedTrip.id);
    }
  }, [selectedTrip, fetchPackingList]);
  
  const organizedList = useMemo(() => {
    if (!currentTripPackingList?.items) return {};
    // Group items by category (e.g., 'tops', 'bottoms', 'essentials')
    return currentTripPackingList.items.reduce((acc, item) => {
        const category = item.clothing_item?.type || 'essentials';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});
  }, [currentTripPackingList]);


  const handleCreateTrip = async (e) => {
    e.preventDefault();
    const success = await createTrip(newTrip);
    if (success) {
      setNewTrip({ destination: '', start_date: '', end_date: '', trip_type: 'vacation', notes: '' });
      setShowCreateForm(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      await deleteTrip(tripId);
    }
  };
  
  const handleCompleteTrip = async () => {
    if (!selectedTrip) return;
    if (window.confirm('Are you sure you want to complete this trip? This will add all packed items to your laundry list.')) {
        await completeTrip(selectedTrip.id);
        setSelectedTrip(null); // Go back to the trip list
    }
  };

  if (selectedTrip) {
    const isCompleted = currentTripPackingList?.status === 'completed';
    return (
      <div className="animate-fadeIn p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
            <div className="mb-4 sm:mb-0">
                <button onClick={() => { setSelectedTrip(null); useWardrobeStore.setState({ currentTripPackingList: null }); }} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to My Trips
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Packing for {selectedTrip.destination}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{new Date(selectedTrip.start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(selectedTrip.end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            {!isCompleted && (
                 <button onClick={handleCompleteTrip} className="btn btn-success bg-green-500 hover:bg-green-600 text-white">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Mark Trip as Completed
                </button>
            )}
        </div>
        
        {currentTripPackingList && <PackingProgressBar items={currentTripPackingList.items} />}

        {tripsLoading && !currentTripPackingList && (
          <div className="text-center py-12">
            <SparklesIcon className="mx-auto h-12 w-12 animate-pulse text-blue-500" />
            <h3 className="text-lg font-medium mt-4">Fetching your packing list...</h3>
            <p className="text-gray-500">Our AI is checking the weather and your wardrobe.</p>
          </div>
        )}

        {currentTripPackingList && (
          <div className="space-y-8">
            {isCompleted && (
                 <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg" role="alert">
                    <p className="font-bold">Trip Completed</p>
                    <p>This trip is finished and the packed items have been added to your laundry list.</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(organizedList).map(([category, items]) => (
                items.length > 0 && (
                  <div key={category} className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-5 transition-all hover:shadow-md">
                    <h4 className="font-semibold text-lg mb-4 capitalize text-gray-800 dark:text-white">{category.replace(/_/g, ' ')}</h4>
                    <ul className="space-y-3">
                      {items.map((item) => (
                          <li key={item.id} className="flex items-center animate-fadeIn" style={{ animationDelay: `${items.indexOf(item) * 50}ms` }}>
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={item.is_packed}
                              onChange={() => togglePackedItem(item.id)}
                              disabled={isCompleted}
                              className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                            />
                            <label htmlFor={`item-${item.id}`} className={`ml-3 block text-sm font-medium ${item.is_packed ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                              {item.item_name} {item.quantity > 1 && <span className="text-gray-500 dark:text-gray-400 font-normal">(x{item.quantity})</span>}
                            </label>
                          </li>
                        ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Trips</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white">
          <PlusIcon className="h-5 w-5 mr-2" />
          {showCreateForm ? 'Cancel' : 'Create New Trip'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700/50 animate-fadeIn">
          <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Plan your next adventure</h3>
          <form onSubmit={handleCreateTrip} className="space-y-4">
            {/* Form fields remain the same, minor styling tweaks could be added */}
            <div>
              <label className="block text-sm font-medium mb-1">Destination *</label>
              <input type="text" required value={newTrip.destination} onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })} className="input-form" placeholder="e.g., Paris, France" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input type="date" required value={newTrip.start_date} onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })} className="input-form" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input type="date" required value={newTrip.end_date} onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })} className="input-form" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trip Type</label>
              <select value={newTrip.trip_type} onChange={(e) => setNewTrip({ ...newTrip, trip_type: e.target.value })} className="input-form">
                <option value="vacation">Vacation</option>
                <option value="business">Business</option>
                <option value="beach">Beach</option>
                <option value="weekend">Weekend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea value={newTrip.notes} onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })} className="input-form" rows="3" placeholder="e.g., Attending a wedding, need formal wear."></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={tripsLoading} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white">
                {tripsLoading ? 'Saving...' : 'Save Trip'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => {
            const isPast = new Date(trip.end_date) < new Date();
            const isCompleted = trip.packing_list?.status === 'completed';
            return (
          <div key={trip.id} className={`bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 flex flex-col justify-between transition-all hover:shadow-lg hover:scale-[1.02] ${isCompleted || isPast ? 'opacity-60' : ''}`}>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{trip.destination}</h3>
                {isCompleted ? (
                     <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full dark:bg-green-900/30 dark:text-green-300">Completed</span>
                ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300 capitalize">{trip.trip_type}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(trip.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(trip.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 px-5 py-3 flex justify-between items-center border-t border-gray-200 dark:border-gray-700/50 rounded-b-xl">
                <button onClick={() => setSelectedTrip(trip)} className="btn btn-secondary text-sm font-medium">View Packing List</button>
                <div className="flex space-x-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteTrip(trip.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
          </div>
        )})}
      </div>
       {trips.length === 0 && !tripsLoading && (
        <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No trips planned yet!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Click "Create New Trip" to start your first packing list.</p>
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white">
            Create Your First Trip
          </button>
        </div>
      )}
    </div>
  );
};

export default PackingAssistant;
