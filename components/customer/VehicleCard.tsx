'use client';

import React from 'react';
import { Vehicle } from '@/types/vehicle';
import { useApp } from '@/context/AppContext';
import { Star, MapPin, Fuel, Gauge, Users, ArrowRight } from 'lucide-react';
import { getVehicleImage, getSafeImageUrl } from '@/lib/vehicle-images';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const { setSelectedVehicleId, setCustomerScreen, formatCurrency } = useApp();

  const isAvailable = vehicle.status === 'available';

  const handleViewDetails = () => {
    setSelectedVehicleId(vehicle.id);
    setCustomerScreen('detail');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBookNow = () => {
    setSelectedVehicleId(vehicle.id);
    setCustomerScreen('checkout');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Safe image path resolution
  const resolvedCover = vehicle.coverImage || getVehicleImage(vehicle.slug || vehicle.model, vehicle.type).coverImage;
  const safeCoverUrl = getSafeImageUrl(resolvedCover);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group h-full">
      {/* Vehicle Image Container */}
      <div className="relative aspect-[16/10] bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200/50 overflow-hidden cursor-pointer" onClick={handleViewDetails}>
        <img
          src={safeCoverUrl}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            const fallback = getVehicleImage(vehicle.name, vehicle.type).coverImage;
            const target = e.target as HTMLImageElement;
            const safeFallback = getSafeImageUrl(fallback);
            if (target.src !== safeFallback) {
              target.src = safeFallback;
            }
          }}
        />

        {/* Availability status badge */}
        <div className="absolute top-3 left-3 bg-[#111827]/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
          {isAvailable ? (
            <span className="text-[#C7F36B] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C7F36B]" />
              Instant Booking Available
            </span>
          ) : (
            <span className="text-amber-400 capitalize flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {vehicle.status === 'booked' ? 'Reserved Next 48h' : 'Scheduled Maintenance'}
            </span>
          )}
        </div>

        {/* Rating badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-gray-900 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{vehicle.rating.toFixed(1)}</span>
          <span className="text-gray-400 font-normal text-[10px]">({vehicle.reviewCount})</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1.5">
            <span className="font-semibold text-gray-700">{vehicle.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{vehicle.category}</span>
            <span aria-hidden="true">·</span>
            <span>{vehicle.year}</span>
          </div>

          <h3
            onClick={handleViewDetails}
            className="text-base font-bold text-gray-900 group-hover:text-black cursor-pointer leading-tight mb-1"
          >
            {vehicle.name}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-1 mb-3">
            {vehicle.variant}
          </p>

          {/* Specs Row */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-gray-50 rounded-xl text-xs text-gray-600 mb-4 border border-gray-100">
            <div className="flex items-center gap-1.5 truncate" title={`Transmission: ${vehicle.transmission}`}>
              <Gauge className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{vehicle.transmission}</span>
            </div>

            <div className="flex items-center gap-1.5 truncate" title={`Fuel: ${vehicle.fuelType}`}>
              <Fuel className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{vehicle.fuelType}</span>
            </div>

            <div
              className="flex items-center gap-1.5 truncate"
              title={vehicle.type === 'car' ? `Seating: ${vehicle.seatingCapacity} Seats` : `Engine: ${vehicle.engineCapacity}`}
            >
              <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {vehicle.type === 'car' ? `${vehicle.seatingCapacity || 5} Seats` : vehicle.engineCapacity}
              </span>
            </div>
          </div>

          {/* Location Hub in Tamil Nadu */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 truncate" title={vehicle.location}>
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{vehicle.location}</span>
          </div>
        </div>

        {/* Pricing and Action Buttons */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-gray-900 tabular-nums">
                {formatCurrency(vehicle.pricePerDay)}
              </span>
              <span className="text-xs text-gray-500 font-medium">/ day</span>
            </div>
            <div className="text-[11px] text-gray-400">
              +{formatCurrency(vehicle.securityDeposit)} ref. deposit
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleViewDetails}
              className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors whitespace-nowrap"
            >
              Details
            </button>
            <button
              type="button"
              onClick={handleBookNow}
              disabled={!isAvailable}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                isAvailable
                  ? 'bg-[#111827] hover:bg-black text-[#C7F36B] shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{isAvailable ? 'Book' : 'Unavailable'}</span>
              {isAvailable && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
