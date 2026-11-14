'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Booking, PricingSnapshot } from '@/types/booking';
import {
  Car,
  MapPin,
  Calendar,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  FileText,
  Check,
  Info,
  Loader2,
  Lock,
} from 'lucide-react';
import { getVehicleImage, getSafeImageUrl } from '@/lib/vehicle-images';

export const CheckoutPage: React.FC = () => {
  const {
    selectedVehicleId,
    getVehicleById,
    vehicles,
    isVehiclesLoading,
    setCustomerScreen,
    currentUser,
    isSupabaseActive,
    setAuthModalMode,
    setIsAuthModalOpen,
    submitBookingToApi,
    formatCurrency,
    searchCriteria,
    hubs,
    refreshCurrentSessionData,
  } = useApp();

  const vehicle = getVehicleById(selectedVehicleId || vehicles[0]?.id || '') || vehicles[0];
  const activeHubs = hubs.filter((h) => h.isActive !== false);

  // Booking Form State
  const [deliveryType, setDeliveryType] = useState<'hub' | 'doorstep'>('hub');
  const [pickupHub, setPickupHub] = useState(
    searchCriteria.location || vehicle?.location || activeHubs[0]?.name || 'T. Nagar Hub, Chennai'
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(searchCriteria.pickupDate);
  const [pickupTime, setPickupTime] = useState(searchCriteria.pickupTime || '09:00');
  const [returnDate, setReturnDate] = useState(searchCriteria.returnDate);
  const [returnTime, setReturnTime] = useState(searchCriteria.returnTime || '18:00');

  // Customer & KYC details synced cleanly from authenticated profile
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [licenceNumber, setLicenceNumber] = useState(currentUser?.licenceNumber || '');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [hasExistingKycOnFile, setHasExistingKycOnFile] = useState(false);

  // Server Pricing State
  const [serverPricing, setServerPricing] = useState<PricingSnapshot | null>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState('');

  // Lifecycle State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [createdPickupOtp, setCreatedPickupOtp] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name || '');
      setCustomerEmail(currentUser.email || '');
      setCustomerPhone(currentUser.phone || '');
      if (currentUser.licenceNumber) {
        setLicenceNumber(currentUser.licenceNumber);
      }

      // Check whether customer already has KYC documents on file
      fetch(`/api/customers/${currentUser.id}/licence`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.success && d.licence) {
            setHasExistingKycOnFile(true);
            if (d.licence.licenceNumber) {
              setLicenceNumber(d.licence.licenceNumber);
            }
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  useEffect(() => {
    if (vehicle?.location && !searchCriteria.location) {
      setPickupHub(vehicle.location);
    }
  }, [vehicle?.location, searchCriteria.location]);

  // Real-time Server Pricing Calculation (/api/pricing/calculate)
  useEffect(() => {
    if (!vehicle?.id || !pickupDate || !returnDate) return;

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
        pickupTime,
        returnDate,
        returnTime,
        deliveryType,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.success && d.pricing) {
          setServerPricing(d.pricing);
        } else {
          setPricingError(d.error || 'Could not retrieve server pricing.');
        }
      })
      .catch((err) => {
        if (active) setPricingError(err?.message || 'Error contacting pricing calculator.');
      })
      .finally(() => {
        if (active) setIsPricingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [vehicle?.id, pickupDate, pickupTime, returnDate, returnTime, deliveryType]);

  if (isVehiclesLoading && !vehicle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F8F9FA] text-gray-500 gap-2">
        <Loader2 className="w-7 h-7 animate-spin text-[#111827]" />
        <p className="text-xs font-semibold">Loading vehicle &amp; hub details...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <h2 className="text-lg font-bold text-gray-900">No Vehicle Selected</h2>
        <button
          type="button"
          onClick={() => setCustomerScreen('explore')}
          className="px-4 py-2 bg-[#111827] text-[#C7F36B] rounded-xl text-xs font-bold cursor-pointer"
        >
          Choose a Vehicle
        </button>
      </div>
    );
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (isSupabaseActive && !currentUser) {
      setFormError('Please sign in to submit your rental booking request.');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (new Date(returnDate) < new Date(pickupDate)) {
      setFormError('Return date must be on or after the pickup date.');
      return;
    }

    if (deliveryType === 'doorstep' && deliveryAddress.trim().length < 8) {
      setFormError('Please enter your complete Tamil Nadu doorstep delivery address.');
      return;
    }

    if (customerName.trim().length < 2) {
      setFormError('Please enter your full name as shown on your Driving Licence.');
      return;
    }

    if (customerPhone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload driving licence documents to private storage bucket if files selected
      if (frontFile) {
        const fd = new FormData();
        fd.append('file', frontFile);
        fd.append('side', 'front');
        if (licenceNumber.trim()) fd.append('licenceNumber', licenceNumber.trim());
        const upRes = await fetch('/api/customers/licence/upload', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.success) {
          setFormError(upData.error || 'Failed to upload Driving Licence (Front).');
          setIsSubmitting(false);
          return;
        }
      }

      if (backFile) {
        const fd = new FormData();
        fd.append('file', backFile);
        fd.append('side', 'back');
        if (licenceNumber.trim()) fd.append('licenceNumber', licenceNumber.trim());
        const upRes = await fetch('/api/customers/licence/upload', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.success) {
          setFormError(upData.error || 'Failed to upload Driving Licence (Back).');
          setIsSubmitting(false);
          return;
        }
      }

      const matchedHub = activeHubs.find((h) => h.name === pickupHub);
      const locationStr = deliveryType === 'hub' ? pickupHub : deliveryAddress.trim();

      const res = await submitBookingToApi({
        vehicleId: vehicle.id,
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
        pickupLocation: locationStr,
        pickupLocationId: matchedHub?.id || vehicle.pickupLocationId,
        returnLocation: locationStr,
        deliveryType,
        deliveryAddress: deliveryType === 'doorstep' ? deliveryAddress.trim() : undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        licenceNumber: licenceNumber.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to submit booking request.');
        return;
      }

      setCreatedBookingId(res.bookingId || null);
      setCreatedPickupOtp(res.pickupOtp || res.booking?.pickupOtp || null);
      setCreatedBooking(res.booking || null);
      setIsSubmitted(true);
      await refreshCurrentSessionData();

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setFormError(err?.message || 'Unexpected error submitting booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
          <span>Back to Explore</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Tracker */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
            <div
              className={`p-2.5 rounded-xl text-xs font-bold ${
                !isSubmitted ? 'bg-[#111827] text-[#C7F36B]' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              <span className="block text-[10px] text-gray-400">Step 1</span>
              <span>Reservation &amp; KYC</span>
            </div>
            <div
              className={`p-2.5 rounded-xl text-xs font-bold ${
                isSubmitted ? 'bg-[#111827] text-[#C7F36B]' : 'bg-gray-50 text-gray-400'
              }`}
            >
              <span className="block text-[10px] text-gray-400">Step 2</span>
              <span>Request Submitted</span>
            </div>
            <div className="hidden sm:block p-2.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-400">
              <span className="block text-[10px] text-gray-400">Step 3</span>
              <span>In-Person Counter Settlement</span>
            </div>
          </div>
        </div>

        {/* Auth Sign-In Reminder Banner when browsing anonymously */}
        {!isSubmitted && isSupabaseActive && !currentUser && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Sign In Required:</strong> Please sign in with your RentRide customer account to link your booking request and driving licence KYC securely.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-[#111827] text-[#C7F36B] text-xs font-bold rounded-xl shrink-0 cursor-pointer"
            >
              Sign In / Create Account
            </button>
          </div>
        )}

        {/* STAGE 1: BOOKING & KYC FORM */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              {formError && (
                <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Delivery / Pickup Choice */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-700" />
                  <span>Pickup Location &amp; Delivery Option</span>
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('hub')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      deliveryType === 'hub'
                        ? 'border-[#111827] bg-[#111827] text-white shadow-md'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Self-Pickup at Hub</span>
                      {deliveryType === 'hub' && <Check className="w-4 h-4 text-[#C7F36B]" />}
                    </div>
                    <span className="text-[11px] text-gray-400 block">Free · Collect at mobility station</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('doorstep')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      deliveryType === 'doorstep'
                        ? 'border-[#111827] bg-[#111827] text-white shadow-md'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">Doorstep Delivery</span>
                      {deliveryType === 'doorstep' && <Check className="w-4 h-4 text-[#C7F36B]" />}
                    </div>
                    <span className="text-[11px] text-gray-400 block">
                      {serverPricing?.doorstepDeliveryFee
                        ? `+${formatCurrency(serverPricing.doorstepDeliveryFee)} · Delivered to address`
                        : 'Delivered to your Tamil Nadu address'}
                    </span>
                  </button>
                </div>

                {deliveryType === 'hub' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Select Tamil Nadu Mobility Hub
                    </label>
                    <select
                      value={pickupHub}
                      onChange={(e) => setPickupHub(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    >
                      {activeHubs.map((hub) => (
                        <option key={hub.id} value={hub.name}>
                          {hub.city} — {hub.name} ({hub.operatingHours})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Delivery Address in Tamil Nadu
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter flat/door no, street, area, city, pincode"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Date & Time Selector */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  <span>Rental Schedule</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block">
                      Pickup
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        required
                      />
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-24 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block">
                      Return
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        required
                      />
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-24 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {serverPricing && (
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                    <span className="font-semibold">Calculated Rental Duration:</span>
                    <span className="font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                      {serverPricing.rentalDurationDays} Day{serverPricing.rentalDurationDays > 1 ? 's' : ''} (24-hr cycle)
                    </span>
                  </div>
                )}
              </div>

              {/* Renter Driving Licence & KYC */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-gray-700" />
                    <span>Renter Details &amp; Driving Licence KYC</span>
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {currentUser?.licenceStatus === 'verified'
                      ? 'KYC Verified'
                      : hasExistingKycOnFile
                      ? 'KYC On File'
                      : 'RTO Compliance'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Full Name (as on DL)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Driving Licence Number</label>
                    <input
                      type="text"
                      value={licenceNumber}
                      onChange={(e) => setLicenceNumber(e.target.value)}
                      placeholder="TN-01-2020-XXXXXXX"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono font-medium focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98400 12345"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-1">Email (for Confirmation)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Private Bucket Licence File Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <label className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold block text-gray-800">Licence Front (Optional)</span>
                        <span className="text-[10px] text-gray-500 truncate block">
                          {frontFile ? frontFile.name : hasExistingKycOnFile ? 'Using uploaded file' : 'JPEG, PNG, PDF (max 5MB)'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold block text-gray-800">Licence Back (Optional)</span>
                        <span className="text-[10px] text-gray-500 truncate block">
                          {backFile ? backFile.name : hasExistingKycOnFile ? 'Using uploaded file' : 'JPEG, PNG, PDF (max 5MB)'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Server Pricing Summary */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-5 sticky top-24">
                <div className="flex gap-4 items-center pb-4 border-b border-gray-100">
                  <div className="w-24 h-16 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden border border-gray-200 shrink-0">
                    <img
                      src={getSafeImageUrl(vehicle.coverImage || getVehicleImage(vehicle.name, vehicle.type).coverImage)}
                      alt={vehicle.name}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        const fallback = getVehicleImage(vehicle.name, vehicle.type).coverImage;
                        const target = e.target as HTMLImageElement;
                        const safeFallback = getSafeImageUrl(fallback);
                        if (target.src !== safeFallback) {
                          target.src = safeFallback;
                        }
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {vehicle.type === 'car' ? 'Self-Drive Car' : 'Motorcycle'} · {vehicle.brand}
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900 leading-tight mt-0.5">{vehicle.name}</h3>
                    <span className="text-xs font-bold text-gray-700 block mt-1">
                      {formatCurrency(vehicle.pricePerDay)}{' '}
                      <span className="font-normal text-gray-500">/ day</span>
                    </span>
                  </div>
                </div>

                {pricingError ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    {pricingError}
                  </div>
                ) : isPricingLoading || !serverPricing ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Computing authoritative server total...</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>
                        Base Rental ({serverPricing.rentalDurationDays} Day
                        {serverPricing.rentalDurationDays > 1 ? 's' : ''})
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(serverPricing.baseRental)}
                      </span>
                    </div>

                    {serverPricing.doorstepDeliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Doorstep Delivery &amp; Handover</span>
                        <span className="font-bold text-gray-900">
                          +{formatCurrency(serverPricing.doorstepDeliveryFee)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Comprehensive Insurance Coverage</span>
                      <span className="font-bold text-gray-900">
                        +{formatCurrency(serverPricing.insuranceFee)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>GST ({serverPricing.gstRate}% Statutory Mobility Tax)</span>
                      <span className="font-bold text-gray-900">
                        +{formatCurrency(serverPricing.gstAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-blue-900 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                      <div>
                        <span className="font-bold block">Refundable Security Deposit</span>
                        <span className="text-[10px] text-blue-700">100% refunded post return inspection</span>
                      </div>
                      <span className="font-bold">{formatCurrency(serverPricing.securityDeposit)}</span>
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-black text-gray-900 block">Total Payable at Hub</span>
                        <span className="text-[10px] text-gray-400">Authoritative server-verified total</span>
                      </div>
                      <span className="text-xl font-black text-gray-900">
                        {formatCurrency(serverPricing.totalAmount)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-2 text-xs text-gray-600">
                  <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    <strong>In-Person Counter Settlement:</strong> No online payment required. Pay via Cash or UPI at the hub counter after fleet KYC approval.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isPricingLoading || Boolean(pricingError)}
                  className="w-full py-4 px-4 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Booking Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Booking Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* STAGE 2: REAL ATOMIC BOOKING CONFIRMATION */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-gray-200 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                Booking Status: Pending Fleet Review · Payment Status: Not Paid
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">
                Booking Request Submitted!
              </h2>
              <p className="text-xs text-gray-500">
                Your reservation request for <span className="font-bold text-gray-900">{vehicle.name}</span> has been recorded in Supabase for date overlap lock protection.
              </p>
            </div>

            <div className="bg-[#111827] text-white p-6 rounded-3xl border border-gray-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#C7F36B] text-[#111827] flex items-center justify-center font-bold">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white leading-tight">Booking Reference</span>
                    <span className="text-[10px] text-gray-400">Tamil Nadu Fleet Network</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#C7F36B]">{createdBookingId}</span>
              </div>

              {createdPickupOtp && (
                <div className="text-center py-2.5 bg-gray-900/80 rounded-2xl border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">
                    Assigned Handover Passcode (Active Upon Approval)
                  </span>
                  <span className="text-4xl font-mono font-black tracking-widest text-[#C7F36B]">
                    {createdPickupOtp}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-gray-400 block text-[10px]">Pickup Date &amp; Time</span>
                  <span className="font-bold text-white">
                    {pickupDate}, {pickupTime}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Location</span>
                  <span className="font-bold text-white truncate block">
                    {deliveryType === 'hub' ? pickupHub : deliveryAddress}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-3 flex justify-between items-center text-xs">
                <span className="text-gray-400">Total Payable at Counter (In-Person):</span>
                <span className="font-bold text-[#C7F36B] text-sm">
                  {formatCurrency(createdBooking?.totalAmount || serverPricing?.totalAmount || 0)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCustomerScreen('dashboard');
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex-1 py-3 px-4 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Go to My Bookings
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerScreen('explore');
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Explore More Rides
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
