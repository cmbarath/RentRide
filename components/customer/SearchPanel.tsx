'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TN_CITIES } from '@/lib/tn-locations';
import { Car, Bike, MapPin, Calendar, Search, AlertCircle } from 'lucide-react';
import { VehicleType } from '@/types/vehicle';

export const SearchPanel: React.FC = () => {
  const { searchCriteria, vehicles, hubs, triggerSearch } = useApp();

  const [selectedType, setSelectedType] = useState<'all' | VehicleType>(searchCriteria.type);
  const [selectedCity, setSelectedCity] = useState(searchCriteria.city || 'chennai');
  const [selectedLocation, setSelectedLocation] = useState(searchCriteria.location);
  const [pickupDate, setPickupDate] = useState(searchCriteria.pickupDate);
  const [pickupTime] = useState(searchCriteria.pickupTime);
  const [returnDate, setReturnDate] = useState(searchCriteria.returnDate);
  const [returnTime] = useState(searchCriteria.returnTime);
  const [dateError, setDateError] = useState('');

  // Derive active hubs per city from live PostgreSQL pickup_locations (fallback to TN_CITIES names cleanly)
  const activeHubs = useMemo(() => hubs.filter((h) => h.isActive !== false), [hubs]);

  const availableCities = useMemo(() => {
    const cityMap = new Map<string, string>();
    activeHubs.forEach((h) => {
      const id = h.cityId || h.city.toLowerCase().replace(/\s+/g, '-');
      if (!cityMap.has(id)) cityMap.set(id, h.city);
    });
    if (cityMap.size === 0) {
      return TN_CITIES.map((c) => ({ id: c.id, name: c.name }));
    }
    return Array.from(cityMap.entries()).map(([id, name]) => ({ id, name }));
  }, [activeHubs]);

  const availableHubs = useMemo(() => {
    const cityEntry = availableCities.find((c) => c.id === selectedCity);
    const matching = activeHubs.filter(
      (h) =>
        (h.cityId && h.cityId === selectedCity) ||
        (cityEntry && h.city.toLowerCase() === cityEntry.name.toLowerCase())
    );
    return matching.length > 0 ? matching : activeHubs;
  }, [activeHubs, availableCities, selectedCity]);

  const handleCityChange = (newCityId: string) => {
    setSelectedCity(newCityId);
    const cityEntry = availableCities.find((c) => c.id === newCityId);
    const matching = activeHubs.filter(
      (h) =>
        (h.cityId && h.cityId === newCityId) ||
        (cityEntry && h.city.toLowerCase() === cityEntry.name.toLowerCase())
    );
    if (matching.length > 0) {
      setSelectedLocation(matching[0].name);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError('');
    if (new Date(returnDate) < new Date(pickupDate)) {
      setDateError('Return date cannot be earlier than pickup date.');
      return;
    }
    triggerSearch({
      type: selectedType,
      category: 'all',
      city: selectedCity,
      location: selectedLocation,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-7 max-w-5xl mx-auto -mt-12 relative z-20">
      {/* Vehicle Type Tabs: All, Self-Drive Cars, Bikes & Scooters */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedType('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedType === 'all'
              ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span>All Vehicles ({vehicles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('car')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedType === 'car'
              ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Self-Drive Cars ({vehicles.filter((v) => v.type === 'car').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('bike')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedType === 'bike'
              ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Bikes &amp; EV Scooters ({vehicles.filter((v) => v.type === 'bike').length})</span>
        </button>
      </div>

      {dateError && (
        <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{dateError}</span>
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
        {/* Tamil Nadu City Selector */}
        <div className="lg:col-span-3">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tamil Nadu City</span>
          </label>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827]"
          >
            {availableCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pickup Hub within City */}
        <div className="lg:col-span-3">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Pickup Hub</span>
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827]"
          >
            {availableHubs.length === 0 ? (
              <option value={selectedLocation}>{selectedLocation}</option>
            ) : (
              availableHubs.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name} {h.areaName ? `(${h.areaName})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Pickup Date */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Pickup Date</span>
          </label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827]"
            required
          />
        </div>

        {/* Return Date */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Return Date</span>
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827]"
            required
          />
        </div>

        {/* Search Action Button */}
        <div className="lg:col-span-2 flex items-end">
          <button
            type="submit"
            className="w-full h-11 bg-[#111827] hover:bg-black text-[#C7F36B] font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Find Rides</span>
          </button>
        </div>
      </form>
    </div>
  );
};
