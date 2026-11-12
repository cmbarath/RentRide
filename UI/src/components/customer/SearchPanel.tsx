import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Car, Bike, MapPin, Calendar, Clock, Search, ArrowRight } from 'lucide-react';
import { VehicleType } from '../../types';

interface SearchPanelProps {
  compact?: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ compact = false }) => {
  const { searchCriteria, setSearchCriteria, triggerSearch, hubs } = useApp();

  const [category, setCategory] = useState<'all' | VehicleType>(searchCriteria.type);
  const [location, setLocation] = useState(searchCriteria.location);
  const [pickupDate, setPickupDate] = useState(searchCriteria.pickupDate);
  const [pickupTime, setPickupTime] = useState(searchCriteria.pickupTime);
  const [returnDate, setReturnDate] = useState(searchCriteria.returnDate);
  const [returnTime, setReturnTime] = useState(searchCriteria.returnTime);

  const calculateDays = () => {
    try {
      const p = new Date(`${pickupDate}T${pickupTime}`);
      const r = new Date(`${returnDate}T${returnTime}`);
      const diff = Math.max(1, Math.ceil((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24)));
      return diff;
    } catch {
      return 1;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch({
      type: category,
      location,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
    });
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-xl border border-gray-100 ${
        compact ? 'p-4' : 'p-6 lg:p-7'
      }`}
    >
      {/* Category selector */}
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            category === 'all'
              ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>All Vehicles</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('car')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            category === 'car'
              ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Cars</span>
        </button>

        <button
          type="button"
          onClick={() => setCategory('bike')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            category === 'bike'
              ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Bikes & Scooters</span>
        </button>

        <div className="ml-auto hidden sm:block text-xs text-gray-500 font-medium">
          Duration: <span className="font-bold text-gray-900">{calculateDays()} Days</span>
        </div>
      </div>

      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          
          {/* Location */}
          <div className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 transition-colors">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Pickup City / Hub
            </label>
            <div className="flex items-center gap-2 text-gray-900 font-medium text-xs">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-xs font-semibold focus:outline-none cursor-pointer truncate"
              >
                {hubs.map((hub) => (
                  <option key={hub.id} value={`${hub.name}, ${hub.city}`}>
                    {hub.name}, {hub.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pickup Date & Time */}
          <div className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 transition-colors">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Pickup Date & Time
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-28 cursor-pointer"
              />
              <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Return Date & Time */}
          <div className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 transition-colors">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Return Date & Time
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none w-28 cursor-pointer"
              />
              <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full h-12 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl font-bold text-xs tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Search Vehicles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
