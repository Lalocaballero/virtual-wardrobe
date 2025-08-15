import React, { useState, useEffect } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { PlusIcon, TrashIcon, PencilIcon, ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

const PackingAssistant = () => {
  const { 
    trips, 
    fetchTrips, 
    createTrip, 
    deleteTrip, 
    tripsLoading,
    generatePackingList,
    currentTripPackingList 
  } = useWardrobeStore();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [packedItems, setPackedItems] = useState({});

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
      // Reset packed items when a new trip is selected
      setPackedItems({});
      generatePackingList(selectedTrip.id);
    }
  }, [selectedTrip, generatePackingList]);

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

  const handleTogglePacked = (category, itemName) => {
    const key = `${category}-${itemName}`;
    setPackedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (selectedTrip) {
    return (
      <div className="animate-fadeIn">
        <button onClick={() => { setSelectedTrip(null); useWardrobeStore.setState({ currentTripPackingList: null }); }} className="btn btn-secondary mb-4">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to My Trips
        </button>
        <h2 className="text-2xl font-bold">Packing List for {selectedTrip.destination}</h2>
        <p className="text-sm mb-4">{new Date(selectedTrip.start_date).toLocaleDateString()} - {new Date(selectedTrip.end_date).toLocaleDateString()}</p>

        {tripsLoading && !currentTripPackingList && (
          <div className="text-center py-12">
            <SparklesIcon className="mx-auto h-12 w-12 animate-pulse text-indigo-500" />
            <h3 className="text-lg font-medium mt-4">Generating your smart packing list...</h3>
            <p>Our AI is checking the weather and your wardrobe.</p>
          </div>
        )}

        {currentTripPackingList && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg mb-2">AI Packing Rationale</h3>
              <p className="text-sm italic">{currentTripPackingList.reasoning}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(currentTripPackingList.packing_list).map(([category, items]) => (
                items.length > 0 && (
                  <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-3 capitalize">{category}</h4>
                    <ul className="space-y-2">
                      {items.map((item, index) => {
                        const itemName = item.name || item;
                        const key = `${category}-${itemName}`;
                        return (
                          <li key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              id={key}
                              checked={!!packedItems[key]}
                              onChange={() => handleTogglePacked(category, itemName)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={key} className={`ml-3 block text-sm ${packedItems[key] ? 'text-gray-500 line-through' : ''}`}>
                              {itemName}
                            </label>
                          </li>
                        );
                      })}
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Trips</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          {showCreateForm ? 'Cancel' : 'Create New Trip'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 animate-fadeIn">
          <h3 className="text-lg font-medium mb-6">Create a New Trip</h3>
          <form onSubmit={handleCreateTrip} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Destination *</label>
              <input type="text" required value={newTrip.destination} onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })} className="w-full" placeholder="e.g., Paris, France" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input type="date" required value={newTrip.start_date} onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input type="date" required value={newTrip.end_date} onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })} className="w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trip Type</label>
              <select value={newTrip.trip_type} onChange={(e) => setNewTrip({ ...newTrip, trip_type: e.target.value })} className="w-full">
                <option value="vacation">Vacation</option>
                <option value="business">Business</option>
                <option value="beach">Beach</option>
                <option value="weekend">Weekend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea value={newTrip.notes} onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })} className="w-full" rows="3" placeholder="e.g., Attending a wedding, need formal wear."></textarea>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={tripsLoading} className="btn btn-primary">
                {tripsLoading ? 'Saving...' : 'Save Trip'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold mb-2">{trip.destination}</h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-indigo-900 dark:text-indigo-300 capitalize">{trip.trip_type}</span>
              </div>
              <p className="text-sm">
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-4 flex justify-between items-center">
                <button onClick={() => setSelectedTrip(trip)} className="btn btn-secondary">View Packing List</button>
                <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteTrip(trip.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <TrashIcon className="h-5 w-5 text-red-500" />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
       {trips.length === 0 && !tripsLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-2">No trips planned yet!</h3>
          <p className="mb-4">Click "Create New Trip" to start your first packing list.</p>
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
            Create New Trip
          </button>
        </div>
      )}
    </div>
  );
};

export default PackingAssistant;
