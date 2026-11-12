'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Booking, BookingStatus, PaymentStatus } from '@/types';
import {
  CalendarCheck,
  Search,
  Filter,
  Check,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Car,
  Bike,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Key,
  Loader2,
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const {
    bookings,
    approveBooking,
    rejectBooking,
    activateBooking,
    completeBooking,
    cancelBooking,
    formatCurrency,
    formatDisplayDate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'approved' | 'confirmed' | 'active' | 'completed' | 'rejected' | 'cancelled'
  >('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [handoverOtpModalBooking, setHandoverOtpModalBooking] = useState<Booking | null>(null);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [licenceSignedUrls, setLicenceSignedUrls] = useState<{
    front: string | null;
    back: string | null;
    licenceNumber?: string | null;
    loading: boolean;
  }>({ front: null, back: null, licenceNumber: null, loading: false });

  useEffect(() => {
    if (!selectedBooking?.customerId) {
      setLicenceSignedUrls({ front: null, back: null, licenceNumber: null, loading: false });
      return;
    }
    let cancelled = false;
    setLicenceSignedUrls({
      front: null,
      back: null,
      licenceNumber: selectedBooking.licenceNumber || null,
      loading: true,
    });
    fetch(`/api/customers/${encodeURIComponent(selectedBooking.customerId)}/licence`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success) {
          setLicenceSignedUrls({
            front: data.signedUrls?.front || null,
            back: data.signedUrls?.back || null,
            licenceNumber: data.licence?.licenceNumber || selectedBooking.licenceNumber || null,
            loading: false,
          });
        } else {
          setLicenceSignedUrls((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) setLicenceSignedUrls((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBooking]);

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    // Tab filter
    if (activeTab === 'pending' && !(b.bookingStatus === 'pending_review' || b.bookingStatus === 'awaiting_licence')) return false;
    if (activeTab === 'approved' && b.bookingStatus !== 'approved') return false;
    if (activeTab === 'confirmed' && b.bookingStatus !== 'confirmed') return false;
    if (activeTab === 'active' && b.bookingStatus !== 'active') return false;
    if (activeTab === 'completed' && b.bookingStatus !== 'completed') return false;
    if (activeTab === 'rejected' && b.bookingStatus !== 'rejected') return false;
    if (activeTab === 'cancelled' && b.bookingStatus !== 'cancelled') return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.vehicleName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-emerald-200">Confirmed</span>;
      case 'approved':
      case 'approved_pending_payment':
        return <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-blue-200">Approved</span>;
      case 'pending_review':
      case 'awaiting_licence':
        return <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-amber-200">Pending Review</span>;
      case 'active':
        return <span className="bg-purple-50 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-purple-200">On The Road</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-gray-200">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-50 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-red-200">Cancelled</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-900 text-[11px] font-bold px-2.5 py-0.5 rounded border border-red-300">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-0.5 rounded border border-gray-200 capitalize">{status}</span>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    if (status === 'paid' || status === 'success') {
      return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">Settled at Counter</span>;
    }
    if (status === 'refunded' || status === 'partially_refunded') {
      return <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">Refunded</span>;
    }
    if (status === 'failed') {
      return <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">Failed</span>;
    }
    return <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">Pay at Hub</span>;
  };

  const runAction = async (bookingId: string, fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => {
    setBusyBookingId(bookingId);
    setFeedback(null);
    const res = await fn();
    setBusyBookingId(null);
    if (res.success) {
      setFeedback({ type: 'success', message: okMsg });
      setSelectedBooking(null);
      setShowRejectModal(false);
      setHandoverOtpModalBooking(null);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Operation failed.' });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Booking & Verification Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit customer driving licences, approve reservations, and monitor active vehicle handovers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold">Total Bookings: {bookings.length}</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.message}
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, customer, vehicle or phone..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending KYC' },
                { id: 'approved', label: 'Approved' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Completed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#111827] text-[#C7F36B] shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-200">
              <tr>
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Customer & Contact</th>
                <th className="py-3 px-3">Vehicle Details</th>
                <th className="py-3 px-3">Dates & Hub</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">KYC Status</th>
                <th className="py-3 px-3">Booking Status</th>
                <th className="py-3 px-3">Counter Settlement</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No bookings found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {b.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{b.customerName}</div>
                      <div className="text-[11px] text-gray-400">{b.customerPhone}</div>
                      <div className="text-[10px] text-gray-400">{b.customerEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {b.vehicleType === 'car' ? (
                          <Car className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <Bike className="w-3.5 h-3.5 text-gray-500" />
                        )}
                        <span className="font-semibold text-gray-800">{b.vehicleName}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 capitalize">{b.vehicleBrand}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-800">
                        {formatDisplayDate(b.pickupDate)} → {formatDisplayDate(b.returnDate)}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#111827]" />
                        <span>{b.pickupLocation}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{formatCurrency(b.totalAmount)}</div>
                      <div className="text-[10px] text-gray-400">Dep: {formatCurrency(b.securityDeposit)}</div>
                    </td>
                    <td className="py-3 px-3">
                      {b.licenceStatus === 'verified' ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                          Verified
                        </span>
                      ) : b.licenceStatus === 'rejected' ? (
                        <span className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded font-bold border border-red-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                          Under Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(b.bookingStatus)}</td>
                    <td className="py-3 px-3">{getPaymentBadge(b.paymentStatus)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs"
                          title="View Details & Licence"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {(b.bookingStatus === 'pending_review' || b.bookingStatus === 'awaiting_licence') && (
                          <button
                            type="button"
                            disabled={busyBookingId === b.id}
                            onClick={() => runAction(b.id, () => approveBooking(b.id), `Booking ${b.id} approved.`)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs cursor-pointer"
                            title="Approve Booking"
                          >
                            {busyBookingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {b.bookingStatus === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => setHandoverOtpModalBooking(b)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Vehicle Handover PIN"
                          >
                            <Key className="w-3 h-3" />
                            <span>Handover</span>
                          </button>
                        )}

                        {b.bookingStatus === 'active' && (
                          <button
                            type="button"
                            disabled={busyBookingId === b.id}
                            onClick={() => runAction(b.id, () => completeBooking(b.id), `Booking ${b.id} marked completed.`)}
                            className="px-2 py-1 bg-gray-800 hover:bg-black disabled:opacity-60 text-[#C7F36B] rounded-lg text-[10px] font-bold cursor-pointer"
                            title="Mark Returned & Completed"
                          >
                            {busyBookingId === b.id ? 'Saving...' : 'Check-In'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Licence & Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Booking {selectedBooking.id} Details</h3>
                <p className="text-xs text-gray-400">{selectedBooking.customerName} · {selectedBooking.vehicleName}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowRejectModal(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 block">Customer Name:</span>
                  <span className="font-bold text-gray-900">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Contact Phone:</span>
                  <span className="font-bold text-gray-900">{selectedBooking.customerPhone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Vehicle:</span>
                  <span className="font-semibold text-gray-900">{selectedBooking.vehicleName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Pickup Hub:</span>
                  <span className="font-semibold text-gray-900">{selectedBooking.pickupLocation}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Duration:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedBooking.pickupDate} to {selectedBooking.returnDate} ({selectedBooking.durationDays} days)
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Total Amount:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(selectedBooking.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Booking Status:</span>
                  {getStatusBadge(selectedBooking.bookingStatus)}
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Counter Settlement:</span>
                  {getPaymentBadge(selectedBooking.paymentStatus)}
                </div>
              </div>

              {/* Licence images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Submitted Driving Licence</span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    DL No: {licenceSignedUrls.licenceNumber || selectedBooking.licenceNumber || 'Not Submitted'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-xl overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
                    {licenceSignedUrls.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : licenceSignedUrls.front ? (
                      <img src={licenceSignedUrls.front} alt="Front" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-400 px-3 text-center">No front DL image</span>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
                    {licenceSignedUrls.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : licenceSignedUrls.back ? (
                      <img src={licenceSignedUrls.back} alt="Back" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-400 px-3 text-center">No back DL image</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection input box */}
              {showRejectModal && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <label className="text-xs font-semibold text-red-900 block">
                    Reason for Rejection:
                  </label>
                  <input
                    type="text"
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="e.g. Expired licence, illegible photo, underage driver"
                    className="w-full p-2 bg-white border border-red-300 rounded-lg text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busyBookingId === selectedBooking.id}
                      onClick={() =>
                        runAction(
                          selectedBooking.id,
                          () =>
                            rejectBooking(
                              selectedBooking.id,
                              rejectionReasonInput.trim() || 'Driving licence verification rejected.'
                            ),
                          `Booking ${selectedBooking.id} rejected.`
                        )
                      }
                      className="px-3 py-1 bg-red-600 disabled:opacity-60 text-white rounded-lg text-xs font-bold"
                    >
                      {busyBookingId === selectedBooking.id ? 'Saving...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!showRejectModal && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyBookingId === selectedBooking.id}
                      onClick={() =>
                        runAction(
                          selectedBooking.id,
                          () => cancelBooking(selectedBooking.id, 'Cancelled by fleet administrator'),
                          `Booking ${selectedBooking.id} cancelled.`
                        )
                      }
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-60 rounded-xl text-xs font-semibold"
                    >
                      Cancel Trip
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold"
                    >
                      Reject DL
                    </button>
                  </div>

                  {(selectedBooking.bookingStatus === 'pending_review' ||
                    selectedBooking.bookingStatus === 'awaiting_licence') && (
                    <button
                      type="button"
                      disabled={busyBookingId === selectedBooking.id}
                      onClick={() =>
                        runAction(
                          selectedBooking.id,
                          () => approveBooking(selectedBooking.id),
                          `Booking ${selectedBooking.id} approved.`
                        )
                      }
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                    >
                      {busyBookingId === selectedBooking.id ? 'Approving...' : 'Approve Booking'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Handover OTP Modal */}
      {handoverOtpModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Vehicle Handover Verification</h3>
              <p className="text-xs text-gray-500 mt-1">
                Match customer {handoverOtpModalBooking.customerName}&apos;s pickup PIN before releasing vehicle keys.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <div className="text-xs text-gray-500 mb-1">Booking Pickup PIN</div>
              <div className="font-mono text-3xl font-black text-[#111827] tracking-widest">
                {handoverOtpModalBooking.pickupOtp || 'N/A'}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHandoverOtpModalBooking(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={busyBookingId === handoverOtpModalBooking.id}
                onClick={() =>
                  runAction(
                    handoverOtpModalBooking.id,
                    () => activateBooking(handoverOtpModalBooking.id),
                    `Keys handed over for ${handoverOtpModalBooking.vehicleName} — trip is now Active.`
                  )
                }
                className="flex-1 py-2 text-xs font-bold bg-[#111827] text-[#C7F36B] rounded-xl hover:bg-black disabled:opacity-60 cursor-pointer"
              >
                {busyBookingId === handoverOtpModalBooking.id ? 'Activating...' : 'Verify & Release Keys'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
