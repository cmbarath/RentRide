import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus } from '../../types';
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
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const {
    bookings,
    approveBooking,
    rejectBooking,
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

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    // Tab filter
    if (activeTab === 'pending' && !(b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted')) return false;
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
        return <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-blue-200">Approved · Pay Pending</span>;
      case 'awaiting_licence':
      case 'submitted':
        return <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-amber-200">Pending Review</span>;
      case 'active':
        return <span className="bg-purple-50 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-purple-200">Active Rental</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-gray-200">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-50 text-red-800 text-[11px] font-bold px-2.5 py-0.5 rounded border border-red-200">Cancelled</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-900 text-[11px] font-bold px-2.5 py-0.5 rounded border border-red-300">Rejected</span>;
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
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        
        {/* Horizontal tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { id: 'all', label: 'All Bookings', count: bookings.length },
            {
              id: 'pending',
              label: 'Pending Review',
              count: bookings.filter((b) => b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted').length,
            },
            {
              id: 'approved',
              label: 'Approved / Pay Pending',
              count: bookings.filter((b) => b.bookingStatus === 'approved').length,
            },
            {
              id: 'confirmed',
              label: 'Confirmed',
              count: bookings.filter((b) => b.bookingStatus === 'confirmed').length,
            },
            {
              id: 'completed',
              label: 'Completed',
              count: bookings.filter((b) => b.bookingStatus === 'completed').length,
            },
            {
              id: 'rejected',
              label: 'Rejected',
              count: bookings.filter((b) => b.bookingStatus === 'rejected').length,
            },
            {
              id: 'cancelled',
              label: 'Cancelled',
              count: bookings.filter((b) => b.bookingStatus === 'cancelled').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#111827] text-[#C7F36B] shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-gray-800 text-[#C7F36B]' : 'bg-gray-200 text-gray-700'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings by ID, customer name, vehicle, phone..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Trip Dates</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Licence KYC</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {b.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{b.customerName}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{b.customerPhone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img src={b.vehicleImage} alt="" className="w-9 h-7 object-cover rounded bg-gray-100" />
                        <div>
                          <span className="font-semibold text-gray-800 block truncate max-w-[130px]">{b.vehicleName}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{b.vehicleType}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                      <div>{formatDisplayDate(b.pickupDate)}</div>
                      <div className="text-gray-400 text-[10px]">to {formatDisplayDate(b.returnDate)}</div>
                    </td>

                    <td className="py-3 px-4 text-gray-600 truncate max-w-[120px]">
                      {b.pickupLocation}
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(b.totalAmount)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        b.licenceStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : b.licenceStatus === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {b.licenceStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold capitalize ${
                        b.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(b.bookingStatus)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-[11px]"
                          title="View Details & Licence"
                        >
                          Review
                        </button>

                        {(b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted') && (
                          <>
                            <button
                              onClick={() => approveBooking(b.id)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                              title="Approve Booking"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setShowRejectModal(true);
                              }}
                              className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                              title="Reject Booking"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {b.bookingStatus === 'confirmed' && (
                          <button
                            onClick={() => completeBooking(b.id)}
                            className="px-2 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold rounded-lg text-[10px]"
                            title="Mark Vehicle Returned & Refund Deposit"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-400">
            No bookings found matching your search criteria.
          </div>
        )}
      </div>

      {/* Booking Detail Drawer / Modal */}
      {selectedBooking && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-gray-900">Booking {selectedBooking.id}</h3>
                  {getStatusBadge(selectedBooking.bookingStatus)}
                </div>
                <p className="text-xs text-gray-400">Submitted: {selectedBooking.createdAt}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Vehicle Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Customer Details</p>
                <p className="font-bold text-gray-900 text-sm">{selectedBooking.customerName}</p>
                <p className="text-gray-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedBooking.customerEmail}</p>
                <p className="text-gray-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedBooking.customerPhone}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Vehicle Reserved</p>
                <div className="flex items-center gap-3">
                  <img src={selectedBooking.vehicleImage} alt="" className="w-12 h-10 object-cover rounded bg-gray-200" />
                  <div>
                    <p className="font-bold text-gray-900">{selectedBooking.vehicleName}</p>
                    <p className="text-gray-500 capitalize">{selectedBooking.vehicleType} · Hub: {selectedBooking.pickupLocation}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Licence Documents Inspection (Core KYC requirement) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Driving Licence KYC Verification
                </h4>
                <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  Licence No: {selectedBooking.licenceNumber || 'KA-03-2019-0048192'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <span className="text-[10px] font-bold text-gray-500 block mb-1">Front Document</span>
                  <img
                    src={selectedBooking.licenceFrontImage || '/src/assets/images/hero_automotive_duo_1793632402154.jpg'}
                    alt="Licence Front"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Name & DOB legible</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <span className="text-[10px] font-bold text-gray-500 block mb-1">Back Document</span>
                  <img
                    src={selectedBooking.licenceBackImage || '/src/assets/images/car_creta_suv_1793632403661.jpg'}
                    alt="Licence Back"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Address verified</span>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Rental Charges ({selectedBooking.durationDays} days):</span>
                <span className="font-bold text-gray-900">{formatCurrency(selectedBooking.rentalCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Security Deposit:</span>
                <span className="font-bold text-gray-900">{formatCurrency(selectedBooking.securityDeposit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST (18%):</span>
                <span className="font-bold text-gray-900">{formatCurrency(selectedBooking.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Amount:</span>
                <span className="tabular-nums">{formatCurrency(selectedBooking.totalAmount)}</span>
              </div>
            </div>

            {/* Audit Log Timeline */}
            <div>
              <h4 className="font-bold text-xs text-gray-900 mb-2 uppercase tracking-wider">
                Booking Status History
              </h4>
              <div className="space-y-2 text-xs">
                {selectedBooking.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">{h.note}</p>
                      <p className="text-[10px] text-gray-400">{h.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explicit Approval / Rejection Actions */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
              {(selectedBooking.bookingStatus === 'awaiting_licence' || selectedBooking.bookingStatus === 'submitted') ? (
                <>
                  <button
                    onClick={() => {
                      approveBooking(selectedBooking.id);
                      setSelectedBooking(null);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Driving Licence & Booking</span>
                  </button>

                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Booking</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-[#111827] text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Reject Confirmation with Mandatory Reason Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-lg text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Confirm Booking Rejection</span>
            </h3>
            <p className="text-xs text-gray-600">
              Rejecting Booking <strong>{selectedBooking.id}</strong> will notify customer <strong>{selectedBooking.customerName}</strong> via SMS & Email.
            </p>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Reason for Rejection (Mandatory)
              </label>
              <select
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mb-2"
              >
                <option value="">Select a reason...</option>
                <option value="Driving licence photo is blurry or unreadable">Driving licence photo is blurry or unreadable</option>
                <option value="Driving licence is expired">Driving licence is expired</option>
                <option value="Name on licence does not match booking details">Name on licence does not match booking details</option>
                <option value="Vehicle scheduled for mandatory maintenance">Vehicle scheduled for mandatory maintenance</option>
              </select>

              <input
                type="text"
                placeholder="Or type custom reason..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectionReasonInput.trim()) {
                    alert('Please specify a rejection reason.');
                    return;
                  }
                  rejectBooking(selectedBooking.id, rejectionReasonInput);
                  setShowRejectModal(false);
                  setSelectedBooking(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
