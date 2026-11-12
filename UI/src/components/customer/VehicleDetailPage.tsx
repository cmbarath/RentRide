import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VehicleCard } from './VehicleCard';
import {
  Star,
  ShieldCheck,
  MapPin,
  Fuel,
  Gauge,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Info,
  Car,
  ChevronLeft,
  Share2,
  Heart,
  Truck,
  RotateCcw,
} from 'lucide-react';

export const VehicleDetailPage: React.FC = () => {
  const {
    selectedVehicleId,
    getVehicleById,
    setCustomerScreen,
    vehicles,
    formatCurrency,
    formatDisplayDate,
    searchCriteria,
  } = useApp();

  const vehicle = getVehicleById(selectedVehicleId || 'veh-car-01') || vehicles[0];

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking widget state
  const [pickupDate, setPickupDate] = useState(searchCriteria.pickupDate);
  const [pickupTime, setPickupTime] = useState(searchCriteria.pickupTime);
  const [returnDate, setReturnDate] = useState(searchCriteria.returnDate);
  const [returnTime, setReturnTime] = useState(searchCriteria.returnTime);
  const [deliveryType, setDeliveryType] = useState<'hub' | 'doorstep'>('hub');
  const [isCopied, setIsCopied] = useState(false);

  // Calculate duration
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(`${returnDate}T${returnTime}`).getTime() -
        new Date(`${pickupDate}T${pickupTime}`).getTime()) /
        (1000 * 60 * 60 * 24)
    ) || 1
  );

  const baseRental = vehicle.pricePerDay * days;
  const doorstepFee = deliveryType === 'doorstep' ? 299 : 0;
  const subtotal = baseRental + doorstepFee;
  const gst = Math.round(subtotal * 0.18);
  const insurance = vehicle.type === 'car' ? 499 : 199;
  const totalPayable = subtotal + gst + insurance;
  const refundableDeposit = vehicle.securityDeposit;

  // Similar vehicles
  const similarVehicles = vehicles
    .filter((v) => v.type === vehicle.type && v.id !== vehicle.id)
    .slice(0, 3);

  const handleProceedToBooking = () => {
    setCustomerScreen('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomerScreen('explore')}
              className="flex items-center gap-1 font-bold text-gray-900 hover:text-black"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Explore</span>
            </button>
            <span aria-hidden="true">/</span>
            <span className="capitalize">{vehicle.type}s</span>
            <span aria-hidden="true">/</span>
            <span className="text-gray-900 font-semibold truncate max-w-xs">{vehicle.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
              <span className="font-bold text-gray-900">{vehicle.brand}</span>
              <span aria-hidden="true">·</span>
              <span>{vehicle.category}</span>
              <span aria-hidden="true">·</span>
              <span>Year {vehicle.year}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">{vehicle.registrationNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {vehicle.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {vehicle.variant} · Reg. Hub: {vehicle.location}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold px-3 py-1.5 rounded-xl text-xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{vehicle.rating.toFixed(1)}</span>
              <span className="text-gray-500 font-normal">({vehicle.reviewCount} reviews)</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>RentRide Certified</span>
            </div>
          </div>
        </div>

        {/* Top 2-Column Split: Gallery on Left + Sticky Booking Panel on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Left Column: Gallery & Details (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Gallery Display */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                <img
                  src={vehicle.images[activeImageIndex] || vehicle.coverImage}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/hero_automotive_duo_1793632402154.jpg';
                  }}
                />
              </div>

              {/* Thumbnails row */}
              {vehicle.images.length > 1 && (
                <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center gap-3 overflow-x-auto">
                  {vehicle.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === idx
                          ? 'border-[#111827] shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Specifications Grid */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Vehicle Specifications
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                    Transmission
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    <span>{vehicle.transmission}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                    Fuel / Powertrain
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <Fuel className="w-4 h-4 text-gray-500" />
                    <span>{vehicle.fuelType}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                    {vehicle.type === 'car' ? 'Seating Capacity' : 'Engine Displacement'}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>
                      {vehicle.type === 'car'
                        ? `${vehicle.seatingCapacity} Adult Seats`
                        : vehicle.engineCapacity}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider mb-1">
                    Fuel Mileage / Range
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="tabular-nums">{vehicle.mileage}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Features */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">About this Vehicle</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {vehicle.description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Included Features & Equipment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {vehicle.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rental & Cancellation Policies */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">Rental Policies & Cancellation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">Driver Age & KYC</p>
                  <p className="text-gray-500 leading-relaxed">
                    Must be 21+ years old with an original valid Driving Licence held for at least 1 year.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">Fuel Policy</p>
                  <p className="text-gray-500 leading-relaxed">
                    Same-to-same fuel level return. If returned with less fuel, market rates apply without penalties.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-900 mb-1">Speed Limit</p>
                  <p className="text-gray-500 leading-relaxed">
                    Commercial speed governor configured at 120 km/h on expressways per national motor vehicle safety guidelines.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900">
                <span className="font-bold">Cancellation Terms:</span> 100% refund up to 6 hours before pickup. 50% refund between 2 to 6 hours. Fully automated instant refunds.
              </div>
            </div>

            {/* Fleet Partner Info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#111827] text-[#C7F36B] flex items-center justify-center font-bold">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Fleet Operations Partner</p>
                  <p className="text-sm font-bold text-gray-900">RentRide Prime Hub - {vehicle.location}</p>
                  <p className="text-[11px] text-gray-400">Regularly sanitised · 180-Point safety inspection verified</p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Verified Fleet
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sticky top-24 space-y-6">
              
              {/* Price header */}
              <div className="pb-4 border-b border-gray-100 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-gray-900 tabular-nums">
                    {formatCurrency(vehicle.pricePerDay)}
                  </span>
                  <span className="text-xs text-gray-500 font-medium"> / day</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Available Now
                  </span>
                </div>
              </div>

              {/* Delivery method toggle */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Handover Method
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('hub')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      deliveryType === 'hub'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Hub Pickup (Free)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('doorstep')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      deliveryType === 'doorstep'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Doorstep (+₹299)</span>
                  </button>
                </div>
              </div>

              {/* Date & Time controls */}
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Pickup Date & Time
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none w-28 cursor-pointer"
                    />
                    <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Return Date & Time
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none w-28 cursor-pointer"
                    />
                    <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
                    <input
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Price Calculation breakdown */}
              <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Rental Charges ({days} {days === 1 ? 'day' : 'days'})
                  </span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(baseRental)}
                  </span>
                </div>

                {deliveryType === 'doorstep' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Doorstep Delivery & Collection</span>
                    <span className="font-semibold text-gray-900 tabular-nums">₹299</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(gst)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Comprehensive Damage Waiver</span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatCurrency(insurance)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-900">
                  <span>Total Payable Amount</span>
                  <span className="text-base text-gray-900 font-black tabular-nums">
                    {formatCurrency(totalPayable)}
                  </span>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-xl text-[11px] text-gray-500 flex items-center justify-between">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-bold text-gray-800 tabular-nums">
                    {formatCurrency(refundableDeposit)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleProceedToBooking}
                className="w-full py-3.5 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Continue to Booking</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-gray-400">
                ⚡ 15-Minute KYC verification. You pay only after approval.
              </p>
            </div>
          </div>

        </div>

        {/* Similar Vehicles Section */}
        {similarVehicles.length > 0 && (
          <div className="pt-12 border-t border-gray-200">
            <h3 className="text-xl font-extrabold text-gray-900 mb-6">
              Similar Vehicles You May Like
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarVehicles.map((simVeh) => (
                <VehicleCard key={simVeh.id} vehicle={simVeh} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
