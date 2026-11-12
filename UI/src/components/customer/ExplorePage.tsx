import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VehicleCard } from './VehicleCard';
import { VehicleType, FuelType, TransmissionType } from '../../types';
import {
  Car,
  Bike,
  SlidersHorizontal,
  X,
  RotateCcw,
  Search,
  Calendar,
  MapPin,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const { vehicles, searchCriteria, setSearchCriteria, formatDisplayDate } = useApp();

  // Search & Filter State
  const [activeType, setActiveType] = useState<'all' | VehicleType>(searchCriteria.type);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<FuelType[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<TransmissionType[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating'>('recommended');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available brands in fleet
  const allBrands = useMemo(() => {
    const brands = new Set(vehicles.map((v) => v.brand));
    return Array.from(brands);
  }, [vehicles]);

  // Filter logic
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        // Type filter
        if (activeType !== 'all' && v.type !== activeType) return false;

        // Search query
        if (
          searchQuery &&
          !`${v.brand} ${v.name} ${v.model} ${v.category} ${v.location}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          return false;
        }

        // Brand filter
        if (selectedBrands.length > 0 && !selectedBrands.includes(v.brand)) {
          return false;
        }

        // Fuel filter
        if (selectedFuelTypes.length > 0 && !selectedFuelTypes.includes(v.fuelType)) {
          return false;
        }

        // Transmission filter
        if (
          selectedTransmissions.length > 0 &&
          !selectedTransmissions.includes(v.transmission)
        ) {
          return false;
        }

        // Price filter
        if (v.pricePerDay > maxPrice) return false;

        // Availability filter
        if (onlyAvailable && v.status !== 'available') return false;

        // Rating filter
        if (minRating > 0 && v.rating < minRating) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.pricePerDay - b.pricePerDay;
        if (sortBy === 'price_desc') return b.pricePerDay - a.pricePerDay;
        if (sortBy === 'rating') return b.rating - a.rating;
        // Default recommended: available first, then highest rating
        if (a.status === 'available' && b.status !== 'available') return -1;
        if (b.status === 'available' && a.status !== 'available') return 1;
        return b.rating - a.rating;
      });
  }, [
    vehicles,
    activeType,
    searchQuery,
    selectedBrands,
    selectedFuelTypes,
    selectedTransmissions,
    maxPrice,
    onlyAvailable,
    minRating,
    sortBy,
  ]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleFuel = (fuel: FuelType) => {
    setSelectedFuelTypes((prev) =>
      prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel]
    );
  };

  const toggleTransmission = (trans: TransmissionType) => {
    setSelectedTransmissions((prev) =>
      prev.includes(trans) ? prev.filter((t) => t !== trans) : [...prev, trans]
    );
  };

  const resetFilters = () => {
    setActiveType('all');
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedFuelTypes([]);
    setSelectedTransmissions([]);
    setMaxPrice(10000);
    setOnlyAvailable(false);
    setMinRating(0);
    setSortBy('recommended');
  };

  const hasActiveFilters =
    activeType !== 'all' ||
    searchQuery !== '' ||
    selectedBrands.length > 0 ||
    selectedFuelTypes.length > 0 ||
    selectedTransmissions.length > 0 ||
    maxPrice < 10000 ||
    onlyAvailable ||
    minRating > 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      
      {/* Search Header Banner */}
      <div className="bg-[#111827] text-white py-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Explore Vehicle Fleet
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>{searchCriteria.location}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>
                    {formatDisplayDate(searchCriteria.pickupDate)} ({searchCriteria.pickupTime}) → {formatDisplayDate(searchCriteria.returnDate)} ({searchCriteria.returnTime})
                  </span>
                </span>
              </div>
            </div>

            {/* Segmented category switcher */}
            <div className="flex items-center bg-gray-800/90 p-1 rounded-xl border border-gray-700/80 self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveType('all');
                  setSearchCriteria((prev) => ({ ...prev, type: 'all' }));
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeType === 'all'
                    ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                All Fleet ({vehicles.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveType('car');
                  setSearchCriteria((prev) => ({ ...prev, type: 'car' }));
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeType === 'car'
                    ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Cars ({vehicles.filter((v) => v.type === 'car').length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveType('bike');
                  setSearchCriteria((prev) => ({ ...prev, type: 'bike' }));
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeType === 'bike'
                    ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Bikes ({vehicles.filter((v) => v.type === 'bike').length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Controls Bar: Search, Mobile Filter Toggle, Sorting, Count */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, model or feature..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-gray-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {hasActiveFilters && '(Active)'}</span>
            </button>

            {/* Results count text */}
            <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
              Showing <span className="font-bold text-gray-900">{filteredVehicles.length}</span> vehicles
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Split: Sidebar Filters (desktop) + Vehicle Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Availability switch */}
            <div>
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs font-semibold text-gray-800">
                <span>Instant Available Only</span>
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-[#111827] focus:ring-[#111827]"
                />
              </label>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-800 mb-2">
                <span>Max Daily Price</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  ₹{maxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={800}
                max={10000}
                step={200}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#111827] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>₹800</span>
                <span>₹10,000+</span>
              </div>
            </div>

            {/* Transmission */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                Transmission
              </h4>
              <div className="space-y-1.5">
                {(['Automatic', 'Manual'] as TransmissionType[]).map((trans) => (
                  <label
                    key={trans}
                    className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTransmissions.includes(trans)}
                      onChange={() => toggleTransmission(trans)}
                      className="w-3.5 h-3.5 rounded text-[#111827]"
                    />
                    <span>{trans}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fuel Type */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                Fuel & Powertrain
              </h4>
              <div className="space-y-1.5">
                {(['Petrol', 'Diesel', 'Electric'] as FuelType[]).map((fuel) => (
                  <label
                    key={fuel}
                    className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFuelTypes.includes(fuel)}
                      onChange={() => toggleFuel(fuel)}
                      className="w-3.5 h-3.5 rounded text-[#111827]"
                    />
                    <span>{fuel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                Vehicle Brand
              </h4>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {allBrands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="w-3.5 h-3.5 rounded text-[#111827]"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5">
                Minimum Rating
              </h4>
              <div className="flex gap-2">
                {[0, 4.5, 4.8].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setMinRating(rate)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      minRating === rate
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {rate === 0 ? 'All' : `${rate}★+`}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Vehicle Cards Grid */}
          <main className="lg:col-span-3">
            {filteredVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              /* Polished Empty State */
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Matching Vehicles Found</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  We couldn't find any vehicles matching your current combination of filters. Try broadening your price range or clearing active filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-[#111827] text-[#C7F36B] rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs h-full p-6 overflow-y-auto ml-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <h3 className="font-bold text-base text-gray-900">Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Mobile Filter content mirroring desktop */}
              <div className="space-y-6">
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-800">
                    <span>Instant Available Only</span>
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="w-4 h-4 rounded text-[#111827]"
                    />
                  </label>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span>Max Price</span>
                    <span className="tabular-nums font-bold">₹{maxPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min={800}
                    max={10000}
                    step={200}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#111827]"
                  />
                </div>

                <div>
                  <h4 className="text-xs font-bold mb-2">Transmission</h4>
                  <div className="space-y-1.5">
                    {(['Automatic', 'Manual'] as TransmissionType[]).map((trans) => (
                      <label key={trans} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedTransmissions.includes(trans)}
                          onChange={() => toggleTransmission(trans)}
                          className="w-3.5 h-3.5 rounded text-[#111827]"
                        />
                        <span>{trans}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold mb-2">Fuel Type</h4>
                  <div className="space-y-1.5">
                    {(['Petrol', 'Diesel', 'Electric'] as FuelType[]).map((fuel) => (
                      <label key={fuel} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedFuelTypes.includes(fuel)}
                          onChange={() => toggleFuel(fuel)}
                          className="w-3.5 h-3.5 rounded text-[#111827]"
                        />
                        <span>{fuel}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#111827] text-[#C7F36B] text-xs font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
