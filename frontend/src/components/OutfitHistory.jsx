import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { format, parse, startOfWeek, getDay, startOfDay } from 'date-fns';
import useWardrobeStore from '../store/wardrobeStore';
import { PhotoIcon, CalendarIcon, Bars3Icon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import OutfitDetailModal from './OutfitDetailModal'; // Import the new modal
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

// Updated event component to show a gallery for a day's outfits
const CustomDayEvent = ({ event }) => (
  <div className="h-full w-full grid grid-cols-2 gap-0.5 p-0.5">
    {event.outfits.slice(0, 4).map(outfit => (
       <div key={outfit.id} className="h-full w-full bg-muted dark:bg-inkwell rounded-sm overflow-hidden">
        {outfit.clothing_items && outfit.clothing_items.length > 0 && outfit.clothing_items[0].image_url ? (
          <img 
            src={outfit.clothing_items[0].image_url} 
            alt={outfit.clothing_items[0].name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    ))}
    {event.outfits.length > 4 && (
      <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 rounded-sm">
        <span className="text-xs font-bold">+{event.outfits.length - 4}</span>
      </div>
    )}
  </div>
);


const ListView = ({ outfits }) => {
  return (
    <div className="space-y-4">
      {outfits.map(outfit => (
        <div key={outfit.id} className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg shadow-sm p-4 md:p-6 border border-fog dark:border-inkwell">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">{format(new Date(outfit.date), 'MMMM d, yyyy')}</h3>
              <p className="text-sm text-slate dark:text-dark-text-secondary">{outfit.weather} • {outfit.mood} mood</p>
            </div>
            <span className="text-sm text-slate dark:text-dark-text-secondary">{format(new Date(outfit.date), 'h:mm a')}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
            {outfit.clothing_items?.map(item => (
              <div key={item.id} className="text-center group relative">
                <div className="aspect-square w-full bg-muted dark:bg-inkwell rounded-lg flex items-center justify-center overflow-hidden">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <PhotoIcon className="h-8 w-8 text-gray-400" />}
                </div>
                <p className="text-xs mt-2 truncate">{item.name}</p>
              </div>
            ))}
          </div>
          {outfit.reason_text && <div className="mt-4 p-3 bg-background dark:bg-gray-900/50 rounded-lg"><p className="text-sm italic text-slate dark:text-cloud-white">"{outfit.reason_text}"</p></div>}
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
  const [selectedOutfits, setSelectedOutfits] = useState(null); // For the modal

  const handleFetchHistory = useCallback((filters) => {
    fetchOutfitHistory(filters);
  }, [fetchOutfitHistory]);

  useEffect(() => {
    // For list view, only fetch if the history is empty to prevent re-fetching on tab switch.
    // For calendar view, we always fetch for the current month.
    if (view === 'list') {
      if (outfitHistory.length === 0) {
        handleFetchHistory();
      }
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      handleFetchHistory({ year, month });
    }
  }, [view, currentDate, handleFetchHistory, outfitHistory.length]);

  const handleFilter = () => {
    if (startDate && endDate) {
      setView('list');
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

  const onSelectEvent = useCallback((event) => {
    setSelectedOutfits(event.outfits);
  }, []);
  
  const events = useMemo(() => {
    const outfitsByDay = outfitHistory.reduce((acc, outfit) => {
      const day = format(startOfDay(new Date(outfit.date)), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(outfit);
      return acc;
    }, {});

    return Object.entries(outfitsByDay).map(([day, outfits]) => ({
      title: `${outfits.length} outfit(s)`,
      start: new Date(day),
      end: new Date(day),
      allDay: true,
      outfits: outfits,
    }));
  }, [outfitHistory]);

  return (
    <div className="space-y-6">
      <OutfitDetailModal outfits={selectedOutfits} onClose={() => setSelectedOutfits(null)} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Outfit History</h2>
        <div className="flex items-center space-x-2 p-1 bg-muted dark:bg-inkwell rounded-lg">
          <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'list' ? 'bg-card dark:bg-dark-subtle dark:bg-gray-900 shadow' : 'text-slate dark:text-cloud-white'}`}><Bars3Icon className="h-5 w-5 inline-block mr-1" />List</button>
          <button onClick={() => setView('calendar')} className={`px-3 py-1 text-sm font-medium rounded-md ${view === 'calendar' ? 'bg-card dark:bg-dark-subtle dark:bg-gray-900 shadow' : 'text-slate dark:text-cloud-white'}`}><CalendarIcon className="h-5 w-5 inline-block mr-1" />Calendar</button>
        </div>
      </div>

      {view === 'list' && (
        <div className="p-4 bg-background dark:bg-gray-900/50 rounded-lg border border-fog dark:border-inkwell">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-inkwell dark:text-cloud-white mb-1">Start Date</label>
                <DatePicker id="startDate" selected={startDate} onChange={date => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} placeholderText="Select start date" className="w-full p-2 border rounded-md dark:bg-inkwell dark:border-inkwell focus:ring-secondary focus:border-secondary" wrapperClassName="w-full" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-inkwell dark:text-cloud-white mb-1">End Date</label>
                <DatePicker id="endDate" selected={endDate} onChange={date => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} placeholderText="Select end date" className="w-full p-2 border rounded-md dark:bg-inkwell dark:border-inkwell focus:ring-secondary focus:border-secondary" wrapperClassName="w-full" />
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
      ) : outfitHistory.length === 0 && view === 'list' ? (
        <div className="text-center py-12 bg-card dark:bg-dark-subtle dark:bg-dark-subtle rounded-lg border border-fog dark:border-inkwell">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">No saved outfits found</h3>
          <p className="mt-1 text-sm text-slate">Try adjusting your filters or save some new outfits!</p>
        </div>
      ) : view === 'list' ? (
        <ListView outfits={outfitHistory} />
      ) : (
        <div className="bg-card dark:bg-dark-subtle dark:bg-dark-subtle p-2 md:p-4 rounded-lg border border-fog dark:border-inkwell h-[80vh]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onNavigate={onNavigate}
            onSelectEvent={onSelectEvent}
            date={currentDate}
            components={{
              event: CustomDayEvent,
            }}
            eventPropGetter={() => ({
              className: '!p-0 !bg-transparent hover:bg-muted dark:hover:bg-inkwell/50 transition-colors cursor-pointer',
            })}
          />
        </div>
      )}
    </div>
  );
};

export default OutfitHistory;