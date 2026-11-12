'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { VehicleCard } from './VehicleCard';
import { Vehicle } from '@/types/vehicle';
import { PricingSnapshot } from '@/types/booking';
import { PublicReviewItem } from '@/types';
import {
  Star,
  MapPin,
  Fuel,
  Gauge,
  Users,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { getVehicleImage } from '@/lib/vehicle-images';

export const VehicleDetailPage: React.FC = () => {
  const {
    selectedVehicleId,
    getVehicleById,
    vehicles,
    isVehiclesLoading,
    setCustomerScreen,
    setSelectedVehicleId,
    formatCurrency,
    searchCriteria,
    setSearchCriteria,
  } = useApp();

  const targetId = selectedVehicleId || vehicles[0]?.id || '';
  const contextVehicle = targetId ? getVehicleById(targetId) : undefined;

  const [fetchedVehicle, setFetchedVehicle] = useState<Vehicle | undefined>(contextVehicle);
  const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState<number>(contextVehicle?.rating || 5.0);
  const [serverPricing, setServerPricing] = useState<PricingSnapshot | null>(null);
  const [isPricingLoading, setIsPricingLoading] = useState<boolean>(false);
  const [pricingError, setPricingError] = useState<string>('');

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pickupDate, setPickupDate] = useState(searchCriteria.pickupDate);
  const [returnDate, setReturnDate] = useState(searchCriteria.returnDate);
  const [deliveryType, setDeliveryType] = useState<'hub' | 'doorstep'>('hub');

  // Hydrate fresh vehicle details & approved reviews from server APIs
  useEffect(() => {
    if (!targetId) return;
    let active = true;

    fetch(`/api/vehicles/${targetId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success && d.vehicle) {
          setFetchedVehicle(d.vehicle);
          setAvgRating(d.vehicle.rating || 5.0);
        }
      })
      .catch(() => {});

    fetch(`/api/reviews?vehicleId=${encodeURIComponent(targetId)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success && Array.isArray(d.reviews)) {
          setReviews(d.reviews);
          if (d.reviews.length > 0 && d.averageRating) {
            setAvgRating(Number(d.averageRating));
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [targetId]);

  const vehicle = fetchedVehicle || contextVehicle;

  // Query authoritative server-side pricing engine whenever dates/delivery change
  useEffect(() => {
    if (!vehicle?.id) return;
    if (!pickupDate || !returnDate) return;

    if (new Date(returnDate) < new Date(pickupDate)) {
      setPricingError('Return date must be on or after the pickup date.');
      setServerPricing(null);
      return;
    }

    let active = true;
    setIsPricingLoading(true);
    setPricingError('');

    fetch('/api/pricing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        pickupDate,
        pickupTime: searchCriteria.pickupTime || '09:00',
        returnDate,
        returnTime: searchCriteria.returnTime || '18:00',
        deliveryType,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.success && d.pricing) {
          setServerPricing(d.pricing);
        } else {
          setPricingError(d.error || 'Could not calculate rental pricing.');
        }
      })
      .catch((err) => {
        if (active) setPricingError(err?.message || 'Error contacting pricing API.');
      })
      .finally(() => {
        if (active) setIsPricingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [vehicle?.id, pickupDate, returnDate, searchCriteria.pickupTime, searchCriteria.returnTime, deliveryType]);

  if (isVehiclesLoading && !vehicle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F8F9FA] text-gray-500 gap-2">
        <Loader2 className="w-7 h-7 animate-spin text-[#111827]" />
        <p className="text-xs font-semibold">Loading vehicle specifications from Supabase...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center space-y-3">
        <AlertCircle className="w-9 h-9 text-amber-500" />
        <h2 className="text-lg font-bold text-gray-900">Vehicle Not Found</h2>
        <p className="text-xs text-gray-500">The requested vehicle may have been removed or deactivated.</p>
        <button
          type="button"
          onClick={() => setCustomerScreen('explore')}
          className="px-4 py-2 bg-[#111827] text-[#C7F36B] rounded-xl text-xs font-bold cursor-pointer"
        >
          Return to Explore Vehicles
        </button>
      </div>
    );
  }

  const gallery =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images
      : getVehicleImage(vehicle.slug || vehicle.model, vehicle.type).galleryImages;

  const isAvailable = vehicle.status === 'available';

  const similarVehicles = vehicles
    .filter((v) => v.type === vehicle.type && v.id !== vehicle.id)
    .slice(0, 3);

  const handleProceedToCheckout = () => {
    if (new Date(returnDate) < new Date(pickupDate)) {
      setPricingError('Please select a return date on or after pickup date.');
      return;
    }
    setSelectedVehicleId(vehicle.id);
    setSearchCriteria((prev) => ({
      ...prev,
      pickupDate,
      returnDate,
      location: vehicle.location || prev.location,
    }));
    setCustomerScreen('checkout');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Back button breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          type="button"
          onClick={() => {
            setCustomerScreen('explore');
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black py-1.5 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Explore Vehicles</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Gallery, Specs, Reviews */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Stage Gallery */}
            <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden mb-3">
                <img
                  src={gallery[activeImageIndex] || gallery[0]}
                  alt={vehicle.name}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    const fallback = getVehicleImage(vehicle.name, vehicle.type).coverImage;
                    (e.target as HTMLImageElement).src = fallback;
                  }}
                />

                <div className="absolute top-4 left-4 bg-[#111827]/85 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-[#C7F36B]' : 'bg-amber-400'}`}
                  />
                  <span>{isAvailable ? 'Instant Booking Available' : `Status: ${vehicle.status}`}</span>
                </div>

                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-gray-900 text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">
                    ({reviews.length || vehicle.reviewCount} Reviews)
                  </span>
                </div>
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#111827] scale-105'
                          : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Header & Specs */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  <span>{vehicle.brand}</span>
                  <span aria-hidden="true">·</span>
                  <span>{vehicle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{vehicle.year} Model</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {vehicle.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {vehicle.variant} · Registration:{' '}
                  <span className="font-mono font-bold text-gray-700">{vehicle.registrationNumber}</span>
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="border-t border-b border-gray-100 py-6">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-4">
                  Vehicle Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>Transmission</span>
                    </div>
                    <div className="font-bold text-sm text-gray-900">{vehicle.transmission}</div>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Fuel className="w-3.5 h-3.5" />
                      <span>Fuel Type</span>
                    </div>
                    <div className="font-bold text-sm text-gray-900">{vehicle.fuelType}</div>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{vehicle.type === 'car' ? 'Seating' : 'Engine'}</span>
                    </div>
                    <div className="font-bold text-sm text-gray-900">
                      {vehicle.type === 'car'
                        ? `${vehicle.seatingCapacity || 5} Adults`
                        : vehicle.engineCapacity || 'Single Cylinder'}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mileage / Range</span>
                    </div>
                    <div className="font-bold text-sm text-gray-900">{vehicle.mileage}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 mb-2">About This Vehicle</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{vehicle.description}</p>
              </div>

              {/* Highlights & Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-3">Key Highlights &amp; Equipment</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vehicle.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pickup Hub Details */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Assigned Tamil Nadu Pickup Hub</h4>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5">{vehicle.location}</p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Counter verification &amp; Cash/UPI payment settlement during key handover
                  </p>
                </div>
              </div>

              {/* Rental Policy & Compliance */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gray-700" />
                  <span>RentRide Tamil Nadu Rental Policies</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500 pl-1">
                  <li>Original valid Indian Driving Licence required during handover.</li>
                  <li>Fuel Policy: Same-to-Same (Vehicle provided matching return tank level).</li>
                  <li>Security deposit refunded after return vehicle inspection.</li>
                </ul>
              </div>
            </div>

            {/* Verified Customer Reviews from /api/reviews */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-gray-900">Verified Customer Reviews</h3>
                  <p className="text-xs text-gray-500">
                    Feedback from RentRide drivers for {vehicle.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-black text-gray-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{avgRating.toFixed(1)}</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500 space-y-1">
                  <MessageSquare className="w-6 h-6 text-gray-300 mx-auto" />
                  <p>No customer reviews published for this vehicle yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{rev.user_name}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(rev.rating)].map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                      <span className="text-[10px] text-gray-400 block">
                        {new Date(rev.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Server-Calculated Pricing & Quick Booking Card */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg space-y-5">
              <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 tabular-nums">
                    {formatCurrency(vehicle.pricePerDay)}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold"> / day</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-700">
                    +{formatCurrency(vehicle.securityDeposit)}
                  </div>
                  <div className="text-[10px] text-gray-400">Refundable Deposit</div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Handover Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('hub')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        deliveryType === 'hub'
                          ? 'bg-[#111827] text-[#C7F36B] border-[#111827]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Hub Pickup (Free)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('doorstep')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        deliveryType === 'doorstep'
                          ? 'bg-[#111827] text-[#C7F36B] border-[#111827]'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Doorstep Delivery
                    </button>
                  </div>
                </div>
              </div>

              {/* Authoritative Server Pricing Summary */}
              {pricingError ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {pricingError}
                </div>
              ) : isPricingLoading || !serverPricing ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-500 border-t border-gray-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating live server pricing...</span>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Base Rental ({serverPricing.rentalDurationDays} Day
                      {serverPricing.rentalDurationDays > 1 ? 's' : ''})
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(serverPricing.baseRental)}
                    </span>
                  </div>

                  {serverPricing.doorstepDeliveryFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Doorstep Delivery Fee</span>
                      <span className="font-semibold text-gray-900">
                        +{formatCurrency(serverPricing.doorstepDeliveryFee)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>GST Tax ({serverPricing.gstRate}%)</span>
                    <span className="font-semibold text-gray-900">
                      +{formatCurrency(serverPricing.gstAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Comprehensive Insurance</span>
                    <span className="font-semibold text-gray-900">
                      +{formatCurrency(serverPricing.insuranceFee)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Refundable Security Deposit</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(serverPricing.securityDeposit)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-black text-gray-900">
                    <span>Total Payable at Hub</span>
                    <span className="text-[#111827]">{formatCurrency(serverPricing.totalAmount)}</span>
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={!isAvailable || Boolean(pricingError) || isPricingLoading}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 shadow-md ${
                  isAvailable && !pricingError
                    ? 'bg-[#111827] hover:bg-black text-[#C7F36B] cursor-pointer disabled:opacity-50'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{isAvailable ? 'Proceed to Book Ride' : 'Vehicle Currently Unavailable'}</span>
                {isAvailable && <ArrowRight className="w-4 h-4" />}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                No online advance payment. Settle in person after KYC review.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Vehicles */}
        {similarVehicles.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">
              Similar {vehicle.type === 'car' ? 'Self-Drive Cars' : 'Two-Wheelers'} You Might Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarVehicles.map((sim) => (
                <VehicleCard key={sim.id} vehicle={sim} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
