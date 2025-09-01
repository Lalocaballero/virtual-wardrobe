import React, { useState, useEffect, useMemo, useRef } from 'react';
import useWardrobeStore from '../store/wardrobeStore';
import { PlusIcon, TrashIcon, PencilIcon, ArrowLeftIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import FeedbackModal from './FeedbackModal'; // Import the new modal

// A new component for the progress bar
const PackingProgressBar = ({ items }) => {
    if (!items) return null;
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

// Reusable Trip Form
const TripForm = ({ trip, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState(trip);
    const destinationInput = useRef(null);

    useEffect(() => {
        if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY && window.google) {
            const autocomplete = new window.google.maps.places.Autocomplete(destinationInput.current, {
                types: ['(cities)'],
            });
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                setFormData(prev => ({ ...prev, destination: place.formatted_address || place.name }));
            });
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700/50 animate-fadeIn">
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                {trip.id ? 'Edit Trip' : 'Plan your next adventure'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Destination *</label>
                    <input ref={destinationInput} type="text" name="destination" required value={formData.destination} onChange={handleChange} className="input-form" placeholder="e.g., Paris, France" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date *</label>
                        <input type="date" name="start_date" required value={formData.start_date} onChange={handleChange} className="input-form" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">End Date *</label>
                        <input type="date" name="end_date" required value={formData.end_date} onChange={handleChange} className="input-form" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Trip Type</label>
                    <select name="trip_type" value={formData.trip_type} onChange={handleChange} className="input-form">
                        <option value="vacation">Vacation</option>
                        <option value="business">Business</option>
                        <option value="beach">Beach</option>
                        <option value="weekend">Weekend</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-form w-full" rows="4" placeholder="e.g., Attending a wedding, need formal wear."></textarea>
                </div>
                <div className="md:col-span-2 flex justify-end pt-2 space-x-3">
                    <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={isLoading} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoading ? 'Saving...' : 'Save Trip'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const PackingAssistant = () => {
  const { 
    trips, 
    fetchTrips, 
    createTrip,
    updateTrip, 
    deleteTrip, 
    tripsLoading,
    fetchPackingList,
    togglePackedItem,
    completeTrip,
    submitPackingListFeedback,
    currentTripPackingList 
  } = useWardrobeStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const initialTripState = {
    destination: '',
    start_date: '',
    end_date: '',
    trip_type: 'vacation',
    notes: ''
  };

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
    return currentTripPackingList.items.reduce((acc, item) => {
        const category = item.clothing_item?.type || 'essentials';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});
  }, [currentTripPackingList]);

  const handleFormSave = async (tripData) => {
    let success;
    if (editingTrip) {
        success = await updateTrip(editingTrip.id, tripData);
    } else {
        success = await createTrip(tripData);
    }
    if (success) {
        setIsFormOpen(false);
        setEditingTrip(null);
    }
  };

  const handleEditClick = (trip) => {
    setEditingTrip({
        ...trip,
        start_date: trip.start_date.split('T')[0],
        end_date: trip.end_date.split('T')[0],
    });
    setIsFormOpen(true);
  };
  
  const handleCompleteTrip = async () => {
    if (!selectedTrip) return;
    // Instead of confirming, open the feedback modal
    setIsFeedbackModalOpen(true);
  };
  
  const handleFeedbackSubmit = async (feedbackData) => {
    if (!currentTripPackingList) return;
    await submitPackingListFeedback(currentTripPackingList.id, feedbackData);
    // After submitting feedback, complete the trip
    await completeTrip(selectedTrip.id);
    setIsFeedbackModalOpen(false);
    setSelectedTrip(null);
  };

  const handleFeedbackSkip = async () => {
    // If skipping, just complete the trip
    await completeTrip(selectedTrip.id);
    setIsFeedbackModalOpen(false);
    setSelectedTrip(null);
  };

  if (selectedTrip) {
    const isCompleted = currentTripPackingList?.status === 'completed';
    return (
      <>
      {isFeedbackModalOpen && (
        <FeedbackModal
          packingList={currentTripPackingList}
          onClose={() => setIsFeedbackModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleFeedbackSkip}
        />
      )}
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

            {currentTripPackingList.reasoning && !isCompleted && (
              <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg" role="alert">
                <div className="flex">
                  <div className="py-1"><SparklesIcon className="h-5 w-5 text-blue-400 mr-3"/></div>
                  <div>
                    <p className="font-bold">AI Packing Rationale</p>
                    <p className="text-sm">{currentTripPackingList.reasoning}</p>
                  </div>
                </div>
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
                              {item.item_name} {item.quantity > 1 && <span className="text-gray-500 dark:text-gray-400 font-normal">(x${item.quantity})</span>}
                            </label>
                          </li>
                        ))}
                    </ul>
                  </div>
                )
              ))}
            </div>

            {/* NEW: Special Outfits Section */}
            {currentTripPackingList.special_outfits && Object.keys(currentTripPackingList.special_outfits).length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Outfits for Special Activities</h3>
                <div className="space-y-8">
                  {Object.entries(currentTripPackingList.special_outfits).map(([activity, outfit]) => (
                    <div key={activity} className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 p-5">
                      <h4 className="font-semibold text-lg capitalize text-indigo-600 dark:text-indigo-400 mb-2">{activity}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">"{outfit.reasoning}"</p>
                      <ul className="space-y-2">
                        {outfit.selected_items.map(itemId => {
                          // Find the full item details from the main packing list
                          const allItems = Object.values(organizedList).flat();
                          const fullItem = allItems.find(i => i.clothing_item?.id === itemId)?.clothing_item;
                          return fullItem ? (
                            <li key={itemId} className="flex items-center">
                              <img src={fullItem.image_url} alt={fullItem.name} className="h-10 w-10 rounded-md object-cover mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{fullItem.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{fullItem.type} - {fullItem.color}</p>
                              </div>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Trips</h1>
        <button onClick={() => { setEditingTrip(null); setIsFormOpen(true); }} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Trip
        </button>
      </div>

      {isFormOpen && (
        <TripForm 
            trip={editingTrip || initialTripState}
            onSave={handleFormSave}
            onCancel={() => { setIsFormOpen(false); setEditingTrip(null); }}
            isLoading={tripsLoading}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => {
            const isCompleted = trip.packing_list?.status === 'completed';
            return (
          <div key={trip.id} className={`bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 flex flex-col justify-between transition-all hover:shadow-lg hover:scale-[1.02] ${isCompleted ? 'opacity-60' : ''}`}>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="flex items-center text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    {isCompleted && <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />}
                    {trip.destination}
                </h3>
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
                    <button onClick={() => handleEditClick(trip)} disabled={isCompleted} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => deleteTrip(trip.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
          </div>
        )})}
      </div>
       {trips.length === 0 && !tripsLoading && !isFormOpen && (
        <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No trips planned yet!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Click "Create New Trip" to start your first packing list.</p>
          <button onClick={() => { setEditingTrip(null); setIsFormOpen(true); }} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white">
            Create Your First Trip
          </button>
        </div>
      )}
    </div>
  );
};

export default PackingAssistant;
