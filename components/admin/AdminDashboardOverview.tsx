'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  TrendingUp,
  CalendarCheck,
  Car,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  X,
  Bike,
  Loader2,
} from 'lucide-react';
import { Booking } from '@/types';
import { getVehicleImagePath, getSafeImageUrl } from '@/lib/vehicle-images';

function isWithinDateWindow(dateIso: string | undefined, period: 'today' | 'week' | 'month' | 'year'): boolean {
  if (!dateIso) return true;
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return true;
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (period === 'today') return diffDays <= 1;
  if (period === 'week') return diffDays <= 7;
  if (period === 'month') return diffDays <= 31;
  return diffDays <= 366;
}

export const AdminDashboardOverview: React.FC = () => {
  const {
    bookings,
    vehicles,
    customers,
    transactions,
    approveBooking,
    rejectBooking,
    formatCurrency,
    formatDisplayDate,
    setAdminScreen,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [selectedAuditBooking, setSelectedAuditBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [signedLicenceUrls, setSignedLicenceUrls] = useState<{ front: string | null; back: string | null; licenceNumber?: string | null; loading: boolean }>({
    front: null,
    back: null,
    licenceNumber: null,
    loading: false,
  });

  useEffect(() => {
    if (!selectedAuditBooking?.customerId) {
      setSignedLicenceUrls({ front: null, back: null, licenceNumber: null, loading: false });
      return;
    }
    let cancelled = false;
    setSignedLicenceUrls({ front: null, back: null, licenceNumber: selectedAuditBooking.licenceNumber || null, loading: true });
    fetch(`/api/customers/${encodeURIComponent(selectedAuditBooking.customerId)}/licence`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success) {
          setSignedLicenceUrls({
            front: data.signedUrls?.front || null,
            back: data.signedUrls?.back || null,
            licenceNumber: data.licence?.licenceNumber || selectedAuditBooking.licenceNumber || null,
            loading: false,
          });
        } else {
          setSignedLicenceUrls((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) setSignedLicenceUrls((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAuditBooking]);

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => isWithinDateWindow(t.transactionDate, dateFilter)),
    [transactions, dateFilter]
  );

  const filteredBookings = useMemo(
    () => bookings.filter((b) => isWithinDateWindow(b.createdAt, dateFilter)),
    [bookings, dateFilter]
  );

  // Key Metrics derived from live state
  const totalRevenue = filteredTransactions
    .filter((t) => t.status === 'success' && (t.type === 'rental_charge' || t.type === 'late_fee'))
    .reduce((sum, t) => sum + t.amount, 0);

  const paidRevenueCount = filteredTransactions.filter((t) => t.status === 'success').length;
  const totalBookings = filteredBookings.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const currentlyRented = vehicles.filter((v) => v.status === 'rented' || v.status === 'booked').length;
  const pendingApprovals = bookings.filter(
    (b) => b.bookingStatus === 'pending_review' || b.bookingStatus === 'awaiting_licence'
  );
  const totalCustomers = customers.length;
  const carCount = vehicles.filter((v) => v.type === 'car').length;
  const bikeCount = vehicles.filter((v) => v.type === 'bike').length;
  const totalFleetCount = vehicles.length || 1;
  const carRatio = Math.round((carCount / totalFleetCount) * 100);
  const bikeRatio = vehicles.length > 0 ? 100 - carRatio : 0;

  const hatchCommuterUnits = vehicles.filter(
    (v) => v.category === 'Hatchback' || v.category === 'Family & Commuter' || v.category === 'Scooter'
  ).length;
  const touringBikeUnits = vehicles.filter(
    (v) => v.type === 'bike' && v.category !== 'Family & Commuter' && v.category !== 'Scooter'
  ).length;
  const suvSedanUnits = vehicles.filter((v) => v.type === 'car' && v.category !== 'Hatchback').length;

  const fleetUtilisation = Math.round((currentlyRented / totalFleetCount) * 100);

  const handleApprove = async (bookingId: string) => {
    setActionBusyId(bookingId);
    setActionFeedback(null);
    const res = await approveBooking(bookingId);
    setActionBusyId(null);
    if (res.success) {
      setActionFeedback({ type: 'success', message: `Booking ${bookingId} approved & handover PIN activated.` });
      setSelectedAuditBooking(null);
    } else {
      setActionFeedback({ type: 'error', message: res.error || 'Failed to approve booking.' });
    }
  };

  const handleReject = async (bookingId: string) => {
    setActionBusyId(bookingId);
    setActionFeedback(null);
    const res = await rejectBooking(bookingId, rejectReason.trim() || 'Licence verification unapproved');
    setActionBusyId(null);
    if (res.success) {
      setActionFeedback({ type: 'success', message: `Booking ${bookingId} marked as rejected.` });
      setSelectedAuditBooking(null);
      setShowRejectBox(false);
      setRejectReason('');
    } else {
      setActionFeedback({ type: 'error', message: res.error || 'Failed to reject booking.' });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Tamil Nadu Fleet Operations & Telemetry
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time analytics, instant KYC verification, and vehicle utilization across all 16 districts.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm text-xs font-bold self-start sm:self-auto">
          {(['today', 'week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDateFilter(period)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                dateFilter === period
                  ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {actionFeedback.message}
          </span>
          <button type="button" onClick={() => setActionFeedback(null)} className="text-current opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 7 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Counter Revenue ({dateFilter})</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {paidRevenueCount} recorded ledger settlements
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Bookings</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">{totalBookings}</div>
          <p className="text-[11px] text-gray-400 mt-1">Confirmed & Active</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Fleet Utilization</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Car className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">{fleetUtilisation}%</div>
          <p className="text-[11px] text-gray-400 mt-1">{currentlyRented} of {vehicles.length} out on road</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Ready at Hubs</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">{availableVehicles}</div>
          <p className="text-[11px] text-gray-400 mt-1">Sanitized & Available</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Pending KYC</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">{pendingApprovals.length}</div>
          <p className="text-[11px] text-gray-400 mt-1">Action required</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Customers</span>
            <span className="p-1.5 bg-gray-100 text-gray-700 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">{totalCustomers}</div>
          <p className="text-[11px] text-gray-400 mt-1">Verified Drivers</p>
        </div>
      </div>

      {/* Fleet Distribution & Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Composition */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Fleet Inventory Split</h2>
              <p className="text-xs text-gray-400">Total {vehicles.length} vehicles registered</p>
            </div>
            <button
              onClick={() => setAdminScreen('vehicles')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Manage Fleet →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold mb-2">
                <Car className="w-4 h-4 text-[#111827]" />
                <span>Cars ({carCount})</span>
              </div>
              <div className="text-xl font-black text-gray-900">{carRatio}%</div>
              <p className="text-[10px] text-gray-400">Hatchbacks, Sedans, SUVs</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold mb-2">
                <Bike className="w-4 h-4 text-[#111827]" />
                <span>Bikes ({bikeCount})</span>
              </div>
              <div className="text-xl font-black text-gray-900">{bikeRatio}%</div>
              <p className="text-[10px] text-gray-400">Commuters, Cruisers, Scooters</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Hatchbacks & Commuters</span>
              <span className="font-bold">{hatchCommuterUnits} Units</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#111827] h-full rounded-full transition-all"
                style={{ width: `${Math.round((hatchCommuterUnits / totalFleetCount) * 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Touring Bikes (Royal Enfield / Cruiser)</span>
              <span className="font-bold">{touringBikeUnits} Units</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#C7F36B] h-full rounded-full border border-gray-300 transition-all"
                style={{ width: `${Math.round((touringBikeUnits / totalFleetCount) * 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>SUVs, Sedans & MPVs</span>
              <span className="font-bold">{suvSedanUnits} Units</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.round((suvSedanUnits / totalFleetCount) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Required: Pending KYC & Driving Licence Verification */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-gray-900">Action Required: KYC Approvals</h2>
                {pendingApprovals.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full animate-pulse">
                    {pendingApprovals.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Verify customer driving licences before authorizing vehicle release</p>
            </div>
            <button
              onClick={() => setAdminScreen('bookings')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              All Bookings →
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-gray-700">All caught up!</p>
              <p className="text-[11px]">No bookings currently pending driving licence verification.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {pendingApprovals.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                      <img
                        src={getSafeImageUrl(b.vehicleImage || getVehicleImagePath(b.vehicleName, b.vehicleType))}
                        alt={b.vehicleName}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          const fallback = getVehicleImagePath(b.vehicleName, b.vehicleType);
                          const target = e.target as HTMLImageElement;
                          const safeFallback = getSafeImageUrl(fallback);
                          if (target.src !== safeFallback) {
                            target.src = safeFallback;
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900">{b.id}</span>
                        <span className="text-xs font-semibold text-gray-800">· {b.vehicleName}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="font-medium text-gray-700">{b.customerName}</span>
                        <span>•</span>
                        <span>{b.customerPhone}</span>
                        <span>•</span>
                        <span className="text-[11px] text-gray-400">DL: {b.licenceNumber || 'Attached'}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {formatDisplayDate(b.pickupDate)} → {formatDisplayDate(b.returnDate)} ({b.durationDays} days) · {b.pickupLocation}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedAuditBooking(b)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Audit DL</span>
                    </button>
                    <button
                      type="button"
                      disabled={actionBusyId === b.id}
                      onClick={() => handleApprove(b.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      {actionBusyId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Modal */}
      {selectedAuditBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Driving Licence Audit: {selectedAuditBooking.customerName}</h3>
                <p className="text-xs text-gray-400">Booking {selectedAuditBooking.id} · {selectedAuditBooking.vehicleName}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedAuditBooking(null);
                  setShowRejectBox(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                  <img
                    src={getSafeImageUrl(selectedAuditBooking.vehicleImage || getVehicleImagePath(selectedAuditBooking.vehicleName, selectedAuditBooking.vehicleType))}
                    alt={selectedAuditBooking.vehicleName}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      const fallback = getVehicleImagePath(selectedAuditBooking.vehicleName, selectedAuditBooking.vehicleType);
                      const target = e.target as HTMLImageElement;
                      const safeFallback = getSafeImageUrl(fallback);
                      if (target.src !== safeFallback) {
                        target.src = safeFallback;
                      }
                    }}
                  />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-gray-900 block leading-tight">{selectedAuditBooking.vehicleName}</span>
                  <span className="text-[11px] text-gray-500 capitalize">{selectedAuditBooking.vehicleType} · {selectedAuditBooking.vehicleBrand}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 block">Licence Number:</span>
                  <span className="font-bold font-mono text-gray-900">
                    {signedLicenceUrls.licenceNumber || selectedAuditBooking.licenceNumber || 'Not Provided'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Phone Contact:</span>
                  <span className="font-bold text-gray-900">{selectedAuditBooking.customerPhone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Rental Dates:</span>
                  <span className="font-semibold text-gray-900">{selectedAuditBooking.pickupDate} to {selectedAuditBooking.returnDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Total Due:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(selectedAuditBooking.totalAmount)}</span>
                </div>
              </div>

              {/* Licence images */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-gray-600 block mb-1">Licence Front:</span>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                    {signedLicenceUrls.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : signedLicenceUrls.front ? (
                      <img src={signedLicenceUrls.front} alt="DL Front" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-400 px-3 text-center">No front DL image uploaded</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-gray-600 block mb-1">Licence Back:</span>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                    {signedLicenceUrls.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : signedLicenceUrls.back ? (
                      <img src={signedLicenceUrls.back} alt="DL Back" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-400 px-3 text-center">No back DL image uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {showRejectBox && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <label className="text-xs font-semibold text-red-900 block">
                    Reason for Rejection:
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Blurry photo, expired validity, class mismatch"
                    className="w-full p-2 bg-white border border-red-300 rounded-lg text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionBusyId === selectedAuditBooking.id}
                      onClick={() => handleReject(selectedAuditBooking.id)}
                      className="px-3 py-1 bg-red-600 disabled:opacity-60 text-white rounded-lg text-xs font-bold"
                    >
                      {actionBusyId === selectedAuditBooking.id ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}

              {!showRejectBox && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(true)}
                    className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reject Licence
                  </button>
                  <button
                    type="button"
                    disabled={actionBusyId === selectedAuditBooking.id}
                    onClick={() => handleApprove(selectedAuditBooking.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    {actionBusyId === selectedAuditBooking.id ? 'Approving...' : 'Approve Booking & Issue Handover PIN'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
