'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Booking, BookingStatus, PaymentStatus } from '@/types/booking';
import {
  Car,
  Key,
  Calendar,
  CheckCircle2,
  User,
  ShieldCheck,
  Star,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  X,
  Phone,
  Upload,
  MapPin,
  Loader2,
  Mail,
  LogOut,
  Save,
} from 'lucide-react';
import { getVehicleImage, getSafeImageUrl } from '@/lib/vehicle-images';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    isAuthLoading,
    bookings,
    cancelBooking,
    formatCurrency,
    setCustomerScreen,
    setIsAuthModalOpen,
    setAuthModalMode,
    updateCustomerProfile,
    signOutWithSupabase,
    refreshCurrentSessionData,
    refreshPublicReviews,
    refreshVehicles,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'licence' | 'profile' | 'support'>('overview');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending'>('all');
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [bookingActionError, setBookingActionError] = useState('');

  // Review state wired to POST /api/reviews
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Profile edit state wired to PATCH /api/customers/me
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // KYC Licence Upload & Signed URL state
  const [kycNumber, setKycNumber] = useState('');
  const [kycFrontUrl, setKycFrontUrl] = useState<string | null>(null);
  const [kycBackUrl, setKycBackUrl] = useState<string | null>(null);
  const [kycStatusText, setKycStatusText] = useState<string>('unverified');
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null);
  const [frontUploadFile, setFrontUploadFile] = useState<File | null>(null);
  const [backUploadFile, setBackUploadFile] = useState<File | null>(null);
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  const [kycMessage, setKycMessage] = useState('');
  const [kycError, setKycError] = useState('');

  const fetchCustomerLicence = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/customers/${userId}/licence`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.licence) {
        setKycNumber(data.licence.licenceNumber || '');
        setKycStatusText(data.licence.status || 'pending');
        setKycRejectionReason(data.licence.rejectionReason || null);
        setKycFrontUrl(data.signedUrls?.front || null);
        setKycBackUrl(data.signedUrls?.back || null);
      }
    } catch {
      // No uploaded licence yet
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setKycStatusText(currentUser.licenceStatus || 'unverified');
      fetchCustomerLicence(currentUser.id);
    }
  }, [currentUser, fetchCustomerLicence]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center bg-[#F8F9FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111827] mb-3" />
        <p className="text-xs font-semibold text-gray-500">Verifying your authenticated session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center bg-[#F8F9FA]">
        <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 mb-5">
          <User className="w-8 h-8 text-[#111827]" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Your RentRide Account</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
          Sign in with your registered email to view your bookings, digital pickup passes, driving licence KYC, and profile settings.
        </p>
        <button
          type="button"
          onClick={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          className="px-6 py-3 bg-[#111827] hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>Sign In to Continue</span>
          <ArrowRight className="w-4 h-4 text-[#C7F36B]" />
        </button>
      </div>
    );
  }

  const userBookings = bookings.filter(
    (b) => b.customerId === currentUser.id || b.customerEmail?.toLowerCase() === currentUser.email?.toLowerCase()
  );

  const displayedBookings = userBookings.filter((b) => {
    if (bookingFilter === 'upcoming') {
      return b.bookingStatus === 'confirmed' || b.bookingStatus === 'approved' || b.bookingStatus === 'approved_pending_payment' || b.bookingStatus === 'active';
    }
    if (bookingFilter === 'completed') return b.bookingStatus === 'completed';
    if (bookingFilter === 'cancelled') return b.bookingStatus === 'cancelled' || b.bookingStatus === 'rejected';
    if (bookingFilter === 'pending') {
      return b.bookingStatus === 'pending_review' || b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted';
    }
    return true;
  });

  const getBookingStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">Confirmed · Approved</span>;
      case 'approved_pending_payment':
        return <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-blue-200">Approved</span>;
      case 'pending_review':
      case 'awaiting_licence':
      case 'submitted':
        return <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-amber-200">Pending Review</span>;
      case 'active':
        return <span className="bg-purple-50 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-purple-200">Active Trip</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-gray-200">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-50 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-red-200">Cancelled</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-900 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-red-300">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    if (status === 'paid' || status === 'success') {
      return <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">Settled at Counter</span>;
    }
    if (status === 'refunded') {
      return <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded">Refunded</span>;
    }
    return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">Pay at Pickup Hub</span>;
  };

  const handleCancelBooking = async (bookingId: string) => {
    setBookingActionError('');
    setCancellingBookingId(bookingId);
    const res = await cancelBooking(bookingId, 'Cancelled by customer from dashboard');
    setCancellingBookingId(null);
    if (!res.success) {
      setBookingActionError(res.error || 'Could not cancel booking.');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    setReviewError('');
    setIsSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: reviewModalBooking.id,
          vehicleId: reviewModalBooking.vehicleId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setReviewError(data.error || 'Failed to submit review.');
      } else {
        setReviewSubmitted(true);
        await Promise.all([refreshPublicReviews(), refreshVehicles()]);
        setTimeout(() => {
          setReviewSubmitted(false);
          setReviewModalBooking(null);
          setReviewComment('');
        }, 1200);
      }
    } catch (err: any) {
      setReviewError(err?.message || 'Network error submitting review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (profileName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }
    const phoneDigits = profilePhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setProfileError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateCustomerProfile({
        fullName: profileName.trim(),
        phone: profilePhone.trim(),
      });
      if (res.success) {
        setProfileSuccess('Your profile details have been saved securely.');
      } else {
        setProfileError(res.error || 'Could not save profile updates.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUploadKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError('');
    setKycMessage('');

    if (!frontUploadFile && !backUploadFile) {
      setKycError('Please select at least one Driving Licence file (Front or Back) to upload.');
      return;
    }

    setIsUploadingKyc(true);
    try {
      if (frontUploadFile) {
        const fd = new FormData();
        fd.append('file', frontUploadFile);
        fd.append('side', 'front');
        if (kycNumber.trim()) fd.append('licenceNumber', kycNumber.trim());
        const res = await fetch('/api/customers/licence/upload', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setKycError(data.error || 'Front licence upload failed.');
          setIsUploadingKyc(false);
          return;
        }
      }

      if (backUploadFile) {
        const fd = new FormData();
        fd.append('file', backUploadFile);
        fd.append('side', 'back');
        if (kycNumber.trim()) fd.append('licenceNumber', kycNumber.trim());
        const res = await fetch('/api/customers/licence/upload', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setKycError(data.error || 'Back licence upload failed.');
          setIsUploadingKyc(false);
          return;
        }
      }

      setFrontUploadFile(null);
      setBackUploadFile(null);
      await fetchCustomerLicence(currentUser.id);
      await refreshCurrentSessionData();
      setKycMessage('Driving licence documents uploaded securely to private KYC vault. Awaiting admin verification.');
    } catch (err: any) {
      setKycError(err?.message || 'Failed to upload driving licence documents.');
    } finally {
      setIsUploadingKyc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top Banner */}
      <div className="bg-[#111827] text-white py-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C7F36B] text-[#111827] font-black text-xl flex items-center justify-center">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold">{currentUser.name}</h1>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 capitalize">
                  KYC: {currentUser.licenceStatus}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {currentUser.email} {currentUser.phone && `· ${currentUser.phone}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomerScreen('explore');
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="px-4 py-2.5 bg-[#C7F36B] hover:bg-[#bbf055] text-[#111827] text-xs font-bold rounded-xl transition-all self-start sm:self-auto flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>Book Another Ride</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: User },
            { id: 'bookings', label: `My Bookings (${userBookings.length})`, icon: Car },
            { id: 'licence', label: 'Driving Licence KYC', icon: ShieldCheck },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'support', label: 'Customer Helpline', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {bookingActionError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bookingActionError}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Total Trips</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{userBookings.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Completed Trips</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {userBookings.filter((b) => b.bookingStatus === 'completed').length}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Upcoming / Active</span>
                <div className="text-2xl font-black text-blue-700 mt-1">
                  {
                    userBookings.filter(
                      (b) =>
                        b.bookingStatus === 'confirmed' ||
                        b.bookingStatus === 'approved' ||
                        b.bookingStatus === 'active'
                    ).length
                  }
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Settled Spend</span>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {formatCurrency(
                    userBookings
                      .filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'success')
                      .reduce((sum, b) => sum + b.totalAmount, 0)
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">Recent Rental Bookings</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Bookings</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {userBookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-xs text-gray-500">
                  No bookings found. Browse our cars and bikes to reserve your first ride!
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          <img
                            src={getSafeImageUrl(b.vehicleImage || getVehicleImage(b.vehicleName, b.vehicleType).coverImage)}
                            alt={b.vehicleName}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              const fallback = getVehicleImage(b.vehicleName, b.vehicleType).coverImage;
                              const target = e.target as HTMLImageElement;
                              const safeFallback = getSafeImageUrl(fallback);
                              if (target.src !== safeFallback) {
                                target.src = safeFallback;
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-extrabold text-[#111827]">{b.id}</span>
                            {getBookingStatusBadge(b.bookingStatus)}
                            {getPaymentStatusBadge(b.paymentStatus)}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">{b.vehicleName}</h3>
                          <p className="text-xs text-gray-500">
                            {b.pickupDate} ({b.pickupTime}) to {b.returnDate} ({b.returnTime}) · {b.pickupLocation}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                        <div className="text-right">
                          <div className="text-sm font-black text-gray-900">{formatCurrency(b.totalAmount)}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedBookingForModal(b)}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `All (${userBookings.length})` },
                { id: 'upcoming', label: 'Confirmed / Active' },
                { id: 'completed', label: 'Completed' },
                { id: 'pending', label: 'Under Review' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBookingFilter(f.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    bookingFilter === f.id
                      ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {displayedBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center">
                <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-gray-900">No bookings in this category</h3>
                <p className="text-xs text-gray-500 mt-1">Change the filter tab or rent a new vehicle.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-18 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        <img
                          src={getSafeImageUrl(b.vehicleImage || getVehicleImage(b.vehicleName, b.vehicleType).coverImage)}
                          alt={b.vehicleName}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            const fallback = getVehicleImage(b.vehicleName, b.vehicleType).coverImage;
                            const target = e.target as HTMLImageElement;
                            const safeFallback = getSafeImageUrl(fallback);
                            if (target.src !== safeFallback) {
                              target.src = safeFallback;
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-extrabold text-[#111827]">{b.id}</span>
                          {getBookingStatusBadge(b.bookingStatus)}
                          {getPaymentStatusBadge(b.paymentStatus)}
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{b.vehicleName}</h3>
                        <p className="text-xs text-gray-500">
                          {b.pickupDate} ({b.pickupTime}) → {b.returnDate} ({b.returnTime})
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{b.pickupLocation}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-4 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
                      <div className="text-left md:text-right">
                        <div className="text-base font-black text-gray-900">{formatCurrency(b.totalAmount)}</div>
                        <div className="text-[11px] text-gray-400">
                          {b.paymentStatus === 'paid' || b.paymentStatus === 'success'
                            ? 'Counter Settlement Paid'
                            : 'Settle In-Person at Hub'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {(b.bookingStatus === 'confirmed' ||
                          b.bookingStatus === 'approved_pending_payment' ||
                          b.bookingStatus === 'approved') &&
                          b.pickupOtp && (
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForModal(b)}
                              className="px-4 py-2 bg-[#111827] hover:bg-black text-[#C7F36B] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Pickup Pass (PIN: {b.pickupOtp})</span>
                            </button>
                          )}

                        {(b.bookingStatus === 'completed' || b.bookingStatus === 'confirmed') && (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewError('');
                              setReviewModalBooking(b);
                            }}
                            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Leave Review</span>
                          </button>
                        )}

                        {(b.bookingStatus === 'pending_review' ||
                          b.bookingStatus === 'awaiting_licence' ||
                          b.bookingStatus === 'submitted' ||
                          b.bookingStatus === 'confirmed') && (
                          <button
                            type="button"
                            disabled={cancellingBookingId === b.id}
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {cancellingBookingId === b.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedBookingForModal(b)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DRIVING LICENCE KYC (LIVE PRIVATE UPLOAD & SIGNED PREVIEW) */}
        {activeTab === 'licence' && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">Driving Licence Document KYC</h2>
                <p className="text-xs text-gray-500">
                  Stored securely in RentRide&apos;s private encrypted KYC storage bucket.
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-md border capitalize ${
                  kycStatusText === 'verified'
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : kycStatusText === 'rejected'
                    ? 'text-red-800 bg-red-50 border-red-200'
                    : 'text-amber-800 bg-amber-50 border-amber-200'
                }`}
              >
                {kycStatusText}
              </span>
            </div>

            {kycRejectionReason && kycStatusText === 'rejected' && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                <strong>Rejection Reason:</strong> {kycRejectionReason}
              </div>
            )}

            {kycError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{kycError}</span>
              </div>
            )}
            {kycMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{kycMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                <span className="text-xs font-bold text-gray-800 block mb-2">Driving Licence (Front)</span>
                <div className="aspect-[16/10] bg-white rounded-xl overflow-hidden border border-gray-200 mb-2 flex items-center justify-center">
                  {kycFrontUrl ? (
                    <img src={kycFrontUrl} alt="DL Front" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-gray-400">No front document uploaded</span>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                <span className="text-xs font-bold text-gray-800 block mb-2">Driving Licence (Back)</span>
                <div className="aspect-[16/10] bg-white rounded-xl overflow-hidden border border-gray-200 mb-2 flex items-center justify-center">
                  {kycBackUrl ? (
                    <img src={kycBackUrl} alt="DL Back" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-gray-400">No back document uploaded</span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUploadKyc} className="space-y-4 border-t border-gray-100 pt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Driving Licence Number</label>
                <input
                  type="text"
                  value={kycNumber}
                  onChange={(e) => setKycNumber(e.target.value)}
                  placeholder="e.g. TN-01-2020-0048192"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="truncate font-semibold text-gray-700">
                    {frontUploadFile ? frontUploadFile.name : 'Upload Front (JPEG/PNG/PDF)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => setFrontUploadFile(e.target.files?.[0] || null)}
                  />
                </label>

                <label className="p-3 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="truncate font-semibold text-gray-700">
                    {backUploadFile ? backUploadFile.name : 'Upload Back (JPEG/PNG/PDF)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => setBackUploadFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isUploadingKyc}
                className="px-5 py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploadingKyc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading to Private Vault...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Submit Licence for Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CUSTOMER PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">Account Profile &amp; Security</h2>
                <p className="text-xs text-gray-500">
                  Manage your verified contact information synced with Supabase Auth.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                  Role: {currentUser.role === 'fleet_manager' ? 'Fleet Manager' : currentUser.role || 'customer'}
                </span>
              </div>
            </div>

            {profileError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98400 12345"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Registered Email (Verified)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Member Since</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={currentUser.joinedDate || 'Recently'}
                      disabled
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => signOutWithSupabase()}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Safely</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: SUPPORT & HELPLINE */}
        {activeTab === 'support' && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-900">RentRide 24/7 Tamil Nadu Helpline</h2>
              <p className="text-xs text-gray-500">Contact our regional fleet dispatch desks in Chennai and Coimbatore.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-gray-900">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Chennai Central Helpline</span>
                </div>
                <p className="text-gray-600">+91 44 2434 9100</p>
                <p className="text-[11px] text-gray-400">T. Nagar / Anna Nagar / OMR / Airport</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-gray-900">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Coimbatore &amp; Nilgiris Desk</span>
                </div>
                <p className="text-gray-600">+91 422 249 8810</p>
                <p className="text-[11px] text-gray-400">Gandhipuram / Peelamedu / Ooty Hub</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL & PICKUP PASS MODAL */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedBookingForModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-mono font-bold text-gray-500">{selectedBookingForModal.id}</span>
              <h2 className="text-xl font-black text-gray-900 mt-1">{selectedBookingForModal.vehicleName}</h2>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {getBookingStatusBadge(selectedBookingForModal.bookingStatus)}
                {getPaymentStatusBadge(selectedBookingForModal.paymentStatus)}
              </div>
            </div>

            {selectedBookingForModal.bookingStatus === 'confirmed' && selectedBookingForModal.pickupOtp && (
              <div className="bg-[#111827] text-white p-5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Digital Pickup Verification Passcode
                </span>
                <span className="text-3xl font-mono font-black text-[#C7F36B] tracking-widest">
                  {selectedBookingForModal.pickupOtp}
                </span>
                <span className="text-[11px] text-gray-300 block">
                  Show this OTP to the fleet officer at {selectedBookingForModal.pickupLocation}
                </span>
              </div>
            )}

            <div className="space-y-2 text-xs border-t border-b border-gray-100 py-3">
              <div className="flex justify-between text-gray-600">
                <span>Pickup Time:</span>
                <span className="font-bold text-gray-900">
                  {selectedBookingForModal.pickupDate}, {selectedBookingForModal.pickupTime}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Return Time:</span>
                <span className="font-bold text-gray-900">
                  {selectedBookingForModal.returnDate}, {selectedBookingForModal.returnTime}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Location:</span>
                <span className="font-bold text-gray-900 text-right max-w-[240px] truncate">
                  {selectedBookingForModal.pickupLocation}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rental Charges:</span>
                <span className="font-bold text-gray-900">{formatCurrency(selectedBookingForModal.rentalCharges)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Security Deposit (Refundable):</span>
                <span className="font-bold text-gray-900">{formatCurrency(selectedBookingForModal.securityDeposit)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
                <span>Total Booking Amount:</span>
                <span>{formatCurrency(selectedBookingForModal.totalAmount)}</span>
              </div>
            </div>

            {selectedBookingForModal.statusHistory && selectedBookingForModal.statusHistory.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-gray-900">Audit Timeline</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedBookingForModal.statusHistory.map((h, i) => (
                    <div key={i} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between text-[11px] font-bold text-gray-800">
                        <span className="capitalize">{h.status.replace(/_/g, ' ')}</span>
                        <span className="text-gray-400 font-normal">{h.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">{h.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedBookingForModal(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* VERIFIED REVIEW MODAL */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setReviewModalBooking(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-black text-gray-900">Rate Your Rental Experience</h2>
              <p className="text-xs text-gray-500 mt-0.5">{reviewModalBooking.vehicleName}</p>
            </div>

            {reviewError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
                {reviewError}
              </div>
            )}

            {reviewSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                Thank you! Your verified review has been saved and published.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Review (min. 5 chars)</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share how smooth the vehicle was, condition, mileage, or handover speed..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                    required
                    minLength={5}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Publishing Review...' : 'Submit Verified Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
