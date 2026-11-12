'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { VehicleCard } from './VehicleCard';
import { Vehicle, VehicleType, FuelType, TransmissionType } from '@/types/vehicle';
import { TN_CITIES } from '@/lib/tn-locations';
import {
  Car,
  Bike,
  SlidersHorizontal,
  X,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const PAGE_LIMIT = 9;

export const ExplorePage: React.FC = () => {
  const { vehicles: allCatalogVehicles, hubs, searchCriteria } = useApp();

  // Filter & Pagination State
  const [activeType, setActiveType] = useState<'all' | VehicleType>(searchCriteria.type || 'all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchCriteria.category || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedFuel, setSelectedFuel] = useState<'all' | FuelType>('all');
  const [selectedTransmission, setSelectedTransmission] = useState<'all' | TransmissionType>('all');
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'>('recommended');
  const [page, setPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // API Response State
  const [pagedVehicles, setPagedVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  // Sync incoming triggerSearch criteria cleanly
  useEffect(() => {
    setActiveType(searchCriteria.type || 'all');
    setSelectedCategory(searchCriteria.category || 'all');
    setPage(1);
  }, [searchCriteria.type, searchCriteria.category]);

  const allBrands = useMemo(() => {
    const brands = new Set(allCatalogVehicles.map((v) => v.brand));
    return Array.from(brands).sort();
  }, [allCatalogVehicles]);

  const dynamicCities = useMemo(() => {
    const map = new Map<string, string>();
    hubs
      .filter((h) => h.isActive !== false)
      .forEach((h) => {
        const id = h.cityId || h.city.toLowerCase().replace(/\s+/g, '-');
        if (!map.has(id)) map.set(id, h.city);
      });
    if (map.size === 0) return TN_CITIES.map((c) => ({ id: c.id, name: c.name }));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [hubs]);

  const availableCategories = useMemo(() => {
    const carCats = new Set<string>();
    const bikeCats = new Set<string>();
    allCatalogVehicles.forEach((v) => {
      if (v.type === 'car') carCats.add(v.category);
      else bikeCats.add(v.category);
    });
    return {
      cars: Array.from(carCats).sort(),
      bikes: Array.from(bikeCats).sort(),
    };
  }, [allCatalogVehicles]);

  const fetchFilteredVehicles = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      if (activeType !== 'all') params.set('type', activeType);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedCity !== 'all') params.set('cityId', selectedCity);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedBrand !== 'all') params.set('brand', selectedBrand);
      if (selectedFuel !== 'all') params.set('fuel', selectedFuel);
      if (selectedTransmission !== 'all') params.set('transmission', selectedTransmission);
      if (maxPrice < 15000) params.set('maxPrice', String(maxPrice));
      if (onlyAvailable) params.set('available', 'true');
      if (minRating > 0) params.set('minRating', String(minRating));
      if (sortBy) params.set('sort', sortBy);
      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      const res = await fetch(`/api/vehicles?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFetchError(data.error || 'Failed to load fleet inventory.');
        setPagedVehicles([]);
        setTotalCount(0);
        setTotalPages(1);
      } else {
        setPagedVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
        setTotalCount(Number(data.total || 0));
        setTotalPages(Math.max(1, Number(data.totalPages || 1)));
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Unable to connect to fleet API.');
      setPagedVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeType,
    selectedCategory,
    selectedCity,
    searchQuery,
    selectedBrand,
    selectedFuel,
    selectedTransmission,
    maxPrice,
    onlyAvailable,
    minRating,
    sortBy,
    page,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchFilteredVehicles();
    }, 150);
    return () => clearTimeout(t);
  }, [fetchFilteredVehicles]);

  const resetFilters = () => {
    setActiveType('all');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedFuel('all');
    setSelectedTransmission('all');
    setMaxPrice(15000);
    setOnlyAvailable(false);
    setMinRating(0);
    setSortBy('recommended');
    setPage(1);
  };

  const hasActiveFilters =
    activeType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedCity !== 'all' ||
    searchQuery !== '' ||
    selectedBrand !== 'all' ||
    selectedFuel !== 'all' ||
    selectedTransmission !== 'all' ||
    maxPrice < 15000 ||
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
                Explore Vehicles in Tamil Nadu
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {isLoading
                  ? 'Querying live Supabase vehicle inventory...'
                  : `Showing ${pagedVehicles.length} of ${totalCount} matching verified rides (Page ${page} of ${totalPages})`}
              </p>
            </div>

            {/* Quick Type Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveType('all');
                  setSelectedCategory('all');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeType === 'all'
                    ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                All ({allCatalogVehicles.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType('car');
                  setSelectedCategory('all');
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeType === 'car'
                    ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Cars ({allCatalogVehicles.filter((v) => v.type === 'car').length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType('bike');
                  setSelectedCategory('all');
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeType === 'bike'
                    ? 'bg-[#C7F36B] text-[#111827] shadow-sm'
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Bikes ({allCatalogVehicles.filter((v) => v.type === 'bike').length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search Bar & Mobile Filter Trigger */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by model, brand, category, or Tamil Nadu city (e.g. Creta, Hunter 350, Ooty)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827] shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters {hasActiveFilters && '(Active)'}</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Filter Sidebar */}
          <div
            className={`lg:block bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-6 ${
              isMobileFilterOpen ? 'block' : 'hidden'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-bold text-sm text-gray-900">Filter Vehicles</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Tamil Nadu City Filter */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Tamil Nadu City</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-900 focus:outline-none"
              >
                <option value="all">All Tamil Nadu Cities</option>
                {dynamicCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-900 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <optgroup label="Car Categories">
                  {availableCategories.cars.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bike Categories">
                  {availableCategories.bikes.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                <span>Max Daily Budget</span>
                <span className="text-emerald-700 font-extrabold">
                  {maxPrice >= 15000 ? 'Any' : `₹${maxPrice.toLocaleString('en-IN')}/day`}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="15000"
                step="250"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full accent-[#111827] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>₹500</span>
                <span>₹15,000+</span>
              </div>
            </div>

            {/* Transmission */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Transmission</label>
              <div className="flex gap-2">
                {(['Manual', 'Automatic'] as TransmissionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTransmission(selectedTransmission === t ? 'all' : t);
                      setPage(1);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedTransmission === t
                        ? 'bg-[#111827] text-[#C7F36B] border-[#111827]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Fuel Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Petrol', 'Diesel', 'Electric', 'Hybrid'] as FuelType[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setSelectedFuel(selectedFuel === f ? 'all' : f);
                      setPage(1);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      selectedFuel === f
                        ? 'bg-[#111827] text-[#C7F36B] border-[#111827]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Select */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-900 focus:outline-none"
              >
                <option value="all">All Manufacturers</option>
                {allBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Toggle */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => {
                    setOnlyAvailable(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-gray-300 text-[#111827] focus:ring-black"
                />
                <span>Available Only</span>
              </label>
            </div>
          </div>

          {/* Vehicle Listing Grid */}
          <div className="lg:col-span-3 space-y-6">
            {fetchError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
                <AlertCircle className="w-7 h-7 text-red-500 mx-auto" />
                <p className="text-xs font-semibold text-red-800">{fetchError}</p>
                <button
                  type="button"
                  onClick={fetchFilteredVehicles}
                  className="px-4 py-2 bg-[#111827] text-[#C7F36B] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Retry Loading Vehicles
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-200 h-80 animate-pulse p-4 space-y-3"
                  >
                    <div className="h-36 bg-gray-200 rounded-xl" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : pagedVehicles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No matching vehicles found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  Try adjusting your budget, selecting another Tamil Nadu city, or clearing some filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 bg-[#111827] text-[#C7F36B] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pagedVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>

                {/* Real Backend Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 bg-white px-5 py-3.5 rounded-2xl border">
                    <span className="text-xs text-gray-500 font-medium">
                      Page <strong className="text-gray-900">{page}</strong> of{' '}
                      <strong className="text-gray-900">{totalPages}</strong> · {totalCount} total vehicles
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setPage(p);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              page === p
                                ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
                                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </button>
                        ))}

                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => {
                          setPage((p) => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
