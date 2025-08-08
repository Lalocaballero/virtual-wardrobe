import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import useWardrobeStore from '../store/wardrobeStore';
import { PhotoIcon, CalendarIcon, Bars3Icon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import "react-datepicker/dist/react-datepicker.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import toast from 'react-hot-toast';

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomOutfitEvent = ({ event }) => (
  <div className="h-full w-full flex items-center justify-center overflow-hidden">
    {event.outfit.clothing_items && event.outfit.clothing_items.length > 0 ? (
      <img 
        src={event.outfit.clothing_items[0].image_url} 
        alt={event.outfit.clothing_items[0].name}
        className="h-full w-full object-cover"
      />
    ) : (
      <span className="text-xs p-1">{event.title}</span>
    )}
  </div>
);

const ListView = ({ outfits }) => {
  // This component now only renders the list view
  return (
    <div className="space-y-4">
      {outfits.map(outfit => (
        <div key={outfit.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">{format(new Date(outfit.date), 'MMMM d, yyyy')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{outfit.weather} • {outfit.mood} mood</p>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(outfit.date), 'h:mm a')}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
            {outfit.clothing_items?.map(item => (
              <div key={item.id} className="text-center group relative">
                <div className="aspect-square w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <PhotoIcon className="h-8 w-8 text-gray-400" />}
                </div>
                <p className="text-xs mt-2 truncate">{item.name}</p>
              </div>
            ))}
          </div>
          {outfit.reason_text && <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"><p className="text-sm italic text-gray-600 dark:text-gray-300">"{outfit.reason_text}"</p></div>}
        </div>
      ))}
    </div>
  );
};

const OutfitHistory = () => {
  const { outfitHistory, fetchOutfitHistory, loading } = useWardrobeStore();
  const [view, setView] = useState('list'); // 'list' or 'calendar'
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleFetchHistory = useCallback((filters) => {
    fetchOutfitHistory(filters);
  }, [fetchOutfitHistory]);

  useEffect(() => {
    if (view === 'list') {
      handleFetchHistory();
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      handleFetchHistory({ year, month });
    }
  }, [view, currentDate, handleFetchHistory]);

  const handleFilter = () => {
    if (startDate && endDate) {
      setView('list'); // Switch to list view for filtered results
      handleFetchHistory({ startDate, endDate });
    } else {
      toast.error("Please select both a start and end date.");
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    if (view !== 'list') setView('list');
    handleFetchHistory();
  };

  const onNavigate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  const events = useMemo(() => outfitHistory.map(outfit => ({
    title: `${outfit.mood} outfit`,
    start: new Date(outfit.date),
    end: new Date(outfit.date),
    allDay: true,
    resource: outfit,
    outfit: outfit,
  })), [outfitHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Outfit History</h2>
        <div className="flex items-center space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
          <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'list' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}><Bars3Icon className="h-5 w-5 inline-block mr-1" />List</button>
          <button onClick={() => setView('calendar')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'calendar' ? 'bg-white dark:bg-gray-900 shadow' : 'text-gray-600 dark:text-gray-300'}`}><CalendarIcon className="h-5 w-5 inline-block mr-1" />Calendar</button>
        </div>
      </div>

      {view === 'list' && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <DatePicker id="startDate" selected={startDate} onChange={date => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} placeholderText="Select start date" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" wrapperClassName="w-full" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <DatePicker id="endDate" selected={endDate} onChange={date => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} placeholderText="Select end date" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" wrapperClassName="w-full" />
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleFilter} disabled={!startDate || !endDate || loading} className="btn btn-primary w-full justify-center">Filter</button>
              <button onClick={handleClear} disabled={loading} className="btn btn-secondary w-full justify-center">Clear</button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
      ) : outfitHistory.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No saved outfits found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your view or filters!</p>
        </div>
      ) : view === 'list' ? (
        <ListView outfits={outfitHistory} />
      ) : (
        <div className="bg-white dark:bg-gray-800 p-2 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-[70vh]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onNavigate={onNavigate}
            date={currentDate}
            components={{
              event: CustomOutfitEvent,
            }}
            eventPropGetter={() => ({
              className: '!p-0 !bg-transparent',
            })}
          />
        </div>
      )}
    </div>
  );
};

export default OutfitHistory;