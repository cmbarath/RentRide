import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus } from '../../types';
import {
  Car,
  Key,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  ShieldCheck,
  Star,
  QrCode,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Download,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    bookings,
    cancelBooking,
    payBooking,
    formatCurrency,
    formatDisplayDate,
    setCustomerScreen,
    setSelectedVehicleId,
    verifyLicence,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'licence' | 'profile' | 'support'>('overview');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending'>('all');
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // User's bookings (filter by currentUser email or id if exists, or show all for rich demonstration)
  const userBookings = bookings.filter(
    (b) => !currentUser || b.customerEmail === currentUser.email || b.customerId === currentUser.id
  );

  const upcomingBookings = userBookings.filter(
    (b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'approved'
  );
  const completedBookings = userBookings.filter((b) => b.bookingStatus === 'completed');
  const pendingBookings = userBookings.filter(
    (b) => b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted'
  );
  const cancelledBookings = userBookings.filter(
    (b) => b.bookingStatus === 'cancelled' || b.bookingStatus === 'rejected'
  );

  const displayedBookings = userBookings.filter((b) => {
    if (bookingFilter === 'upcoming') return b.bookingStatus === 'confirmed' || b.bookingStatus === 'approved';
    if (bookingFilter === 'completed') return b.bookingStatus === 'completed';
    if (bookingFilter === 'cancelled') return b.bookingStatus === 'cancelled' || b.bookingStatus === 'rejected';
    if (bookingFilter === 'pending') return b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted';
    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-200">Confirmed</span>;
      case 'approved':
        return <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">Approved · Pay Pending</span>;
      case 'awaiting_licence':
      case 'submitted':
        return <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-200">Awaiting Review</span>;
      case 'active':
        return <span className="bg-purple-50 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-md border border-purple-200">Active Trip</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-md border border-gray-200">Completed</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="bg-red-50 text-red-800 text-xs font-bold px-2.5 py-1 rounded-md border border-red-200">Cancelled / Rejected</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Top Banner */}
      <div className="bg-[#111827] text-white py-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C7F36B] text-[#111827] font-black text-xl flex items-center justify-center">
              {currentUser?.name.charAt(0) || 'R'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold">{currentUser?.name || 'Rohan Sharma'}</h1>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {currentUser?.licenceStatus === 'verified' ? 'Verified Driver' : 'KYC Pending'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {currentUser?.email || 'rohan.sharma@gmail.com'} · {currentUser?.phone || '+91 98450 12345'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCustomerScreen('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2.5 bg-[#C7F36B] hover:bg-[#bbf055] text-[#111827] text-xs font-bold rounded-xl transition-all self-start sm:self-auto flex items-center gap-1.5 shadow-sm"
          >
            <Car className="w-4 h-4" />
            <span>Book Another Ride</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-1 space-y-2 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm h-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'overview'
                  ? 'bg-[#111827] text-[#C7F36B]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'bookings'
                  ? 'bg-[#111827] text-[#C7F36B]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Car className="w-4 h-4" />
                <span>My Bookings</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                {userBookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('licence')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'licence'
                  ? 'bg-[#111827] text-[#C7F36B]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Driving Licence & KYC</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'profile'
                  ? 'bg-[#111827] text-[#C7F36B]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'support'
                  ? 'bg-[#111827] text-[#C7F36B]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>24/7 Roadside Support</span>
            </button>
          </aside>

          {/* Right Main Panel */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
                    <p className="text-2xl font-black text-gray-900 mt-1 tabular-nums">{userBookings.length}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Self-drive rentals</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming Trips</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{upcomingBookings.length}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Confirmed & ready</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-black text-blue-600 mt-1 tabular-nums">{completedBookings.length}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Returned safely</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending KYC</p>
                    <p className="text-2xl font-black text-amber-600 mt-1 tabular-nums">{pendingBookings.length}</p>
                    <p className="text-[11px] text-gray-500 mt-1">In review queue</p>
                  </div>
                </div>

                {/* Upcoming or Active Trip Banner */}
                {upcomingBookings.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Upcoming Rental Pickup</span>
                      </h3>
                      {getStatusBadge(upcomingBookings[0].bookingStatus)}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={upcomingBookings[0].vehicleImage}
                          alt="Vehicle"
                          className="w-20 h-16 object-cover rounded-lg bg-gray-200"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{upcomingBookings[0].vehicleName}</h4>
                          <p className="text-xs text-gray-500">
                            Pickup: {formatDisplayDate(upcomingBookings[0].pickupDate)} at {upcomingBookings[0].pickupTime}
                          </p>
                          <p className="text-xs text-gray-500">
                            Location: {upcomingBookings[0].pickupLocation}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {upcomingBookings[0].bookingStatus === 'approved' && (
                          <button
                            onClick={() => {
                              payBooking(upcomingBookings[0].id, 'UPI');
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                          >
                            Pay {formatCurrency(upcomingBookings[0].totalAmount)} Now
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBookingForModal(upcomingBookings[0])}
                          className="px-4 py-2 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-bold"
                        >
                          View Pickup Pass
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Bookings List */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-gray-900">Recent Bookings</h3>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      <span>View All ({userBookings.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {userBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 p-2 rounded-xl transition-colors cursor-pointer"
                        onClick={() => setSelectedBookingForModal(booking)}
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={booking.vehicleImage}
                            alt=""
                            className="w-14 h-12 rounded-lg object-cover bg-gray-200"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-gray-900">{booking.id}</span>
                              <span className="text-gray-300">·</span>
                              <span className="font-semibold text-xs text-gray-800">{booking.vehicleName}</span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {formatDisplayDate(booking.pickupDate)} → {formatDisplayDate(booking.returnDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-xs font-bold text-gray-900 tabular-nums">
                              {formatCurrency(booking.totalAmount)}
                            </span>
                            <div className="text-[10px] text-gray-400 capitalize">
                              Payment: {booking.paymentStatus}
                            </div>
                          </div>
                          {getStatusBadge(booking.bookingStatus)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MY BOOKINGS TABLE */}
            {activeTab === 'bookings' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="font-bold text-base text-gray-900">Booking History & Trips</h3>

                  {/* Sub-tabs */}
                  <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl text-xs font-bold">
                    {(['all', 'upcoming', 'pending', 'completed', 'cancelled'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setBookingFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                          bookingFilter === filter
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="pb-3">Booking ID & Vehicle</th>
                          <th className="pb-3">Pickup Date</th>
                          <th className="pb-3">Return Date</th>
                          <th className="pb-3">Total Amount</th>
                          <th className="pb-3">Booking Status</th>
                          <th className="pb-3">Payment</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {displayedBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3.5 pr-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={b.vehicleImage}
                                  alt=""
                                  className="w-12 h-10 object-cover rounded-md bg-gray-100 shrink-0"
                                />
                                <div>
                                  <span className="font-mono font-bold text-gray-900 block">{b.id}</span>
                                  <span className="text-gray-600 font-medium truncate max-w-[140px] block">{b.vehicleName}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 pr-3 text-gray-700 font-medium">
                              {formatDisplayDate(b.pickupDate)}
                              <span className="text-gray-400 block text-[10px]">{b.pickupTime}</span>
                            </td>
                            <td className="py-3.5 pr-3 text-gray-700 font-medium">
                              {formatDisplayDate(b.returnDate)}
                              <span className="text-gray-400 block text-[10px]">{b.returnTime}</span>
                            </td>
                            <td className="py-3.5 pr-3 font-bold text-gray-900 tabular-nums">
                              {formatCurrency(b.totalAmount)}
                            </td>
                            <td className="py-3.5 pr-3">
                              {getStatusBadge(b.bookingStatus)}
                            </td>
                            <td className="py-3.5 pr-3">
                              <span className={`text-[11px] font-semibold capitalize ${b.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {b.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={() => setSelectedBookingForModal(b)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold text-[11px]"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No bookings found in this category.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LICENCE & KYC */}
            {activeTab === 'licence' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Driving Licence & KYC Verification</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your driving licence is securely verified by our fleet team for zero-delay vehicle handovers.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-emerald-950">Driving Licence: Verified</p>
                      <p className="text-xs text-emerald-800 font-mono">
                        Number: {currentUser?.licenceNumber || 'KA-03-2019-0048192'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                    Active & Valid till 2038
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-xs font-bold text-gray-800 mb-2">Front Side Document</p>
                    <img
                      src="/src/assets/images/hero_automotive_duo_1793632402154.jpg"
                      alt="Licence Front"
                      className="w-full h-36 object-cover rounded-lg border border-gray-200"
                    />
                    <p className="text-[10px] text-gray-400 mt-2">Verified against Ministry of Road Transport database.</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-xs font-bold text-gray-800 mb-2">Back Side Document</p>
                    <img
                      src="/src/assets/images/car_creta_suv_1793632403661.jpg"
                      alt="Licence Back"
                      className="w-full h-36 object-cover rounded-lg border border-gray-200"
                    />
                    <p className="text-[10px] text-gray-400 mt-2">Address & blood group verification complete.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => alert('KYC update document request submitted to compliance team.')}
                    className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50"
                  >
                    Upload New / Renewed Licence
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: PROFILE & SETTINGS */}
            {activeTab === 'profile' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                <h3 className="font-bold text-base text-gray-900">Personal Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      defaultValue={currentUser?.name || 'Rohan Sharma'}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={currentUser?.email || 'rohan.sharma@gmail.com'}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      defaultValue={currentUser?.phone || '+91 98450 12345'}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Default City</label>
                    <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium">
                      <option>Bengaluru, Karnataka</option>
                      <option>Mumbai, Maharashtra</option>
                      <option>New Delhi, NCR</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => alert('Profile settings saved successfully.')}
                  className="px-4 py-2 bg-[#111827] text-[#C7F36B] font-bold text-xs rounded-xl hover:bg-black"
                >
                  Save Profile Changes
                </button>
              </div>
            )}

            {/* TAB 5: 24/7 ROADSIDE SUPPORT */}
            {activeTab === 'support' && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Emergency & Roadside Assistance</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Our pan-India roadside assistance team is on call 24 hours a day, 7 days a week.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-5 bg-red-50 rounded-2xl border border-red-200">
                    <p className="font-bold text-red-900 text-sm">Emergency Roadside SOS</p>
                    <p className="text-red-700 mt-1">Flat tyre, mechanical stall, towing, battery jumpstart</p>
                    <p className="text-lg font-black text-red-950 mt-3 font-mono">1800-209-9090</p>
                  </div>

                  <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200">
                    <p className="font-bold text-blue-900 text-sm">Rental Concierge & Extension</p>
                    <p className="text-blue-700 mt-1">Extend trip hours, change return hub, billing inquiries</p>
                    <p className="text-lg font-black text-blue-950 mt-3 font-mono">+91 800-RENTRIDE</p>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Booking Detail Modal with Timeline & Handover Pass */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-gray-900">Booking Details</h3>
                  <span className="font-mono text-xs font-bold text-gray-500">
                    {selectedBookingForModal.id}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Submitted on {selectedBookingForModal.createdAt}</p>
              </div>
              <button
                onClick={() => setSelectedBookingForModal(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vehicle Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <img
                src={selectedBookingForModal.vehicleImage}
                alt=""
                className="w-20 h-16 object-cover rounded-lg bg-gray-200"
              />
              <div>
                <h4 className="font-bold text-base text-gray-900">{selectedBookingForModal.vehicleName}</h4>
                <p className="text-xs text-gray-500">
                  {selectedBookingForModal.pickupLocation}
                </p>
                <div className="mt-1">
                  {getStatusBadge(selectedBookingForModal.bookingStatus)}
                </div>
              </div>
            </div>

            {/* Handover Pass / OTP (if approved or confirmed) */}
            {(selectedBookingForModal.bookingStatus === 'confirmed' || selectedBookingForModal.bookingStatus === 'approved') && (
              <div className="p-4 bg-lime-50 rounded-xl border border-lime-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#111827]">Vehicle Pickup Pass</p>
                  <p className="text-[11px] text-gray-600">Provide this code to hub staff at handover</p>
                  <p className="text-xl font-black text-gray-900 font-mono mt-1">
                    OTP: {selectedBookingForModal.pickupOtp || '7291'}
                  </p>
                </div>
                <div className="w-16 h-16 bg-[#111827] text-[#C7F36B] rounded-lg flex items-center justify-center">
                  <QrCode className="w-10 h-10" />
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-2 text-xs border-y border-gray-100 py-3">
              <div className="flex justify-between text-gray-600">
                <span>Rental Charges ({selectedBookingForModal.durationDays} days):</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedBookingForModal.rentalCharges)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Refundable Security Deposit:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedBookingForModal.securityDeposit)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (18%):</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedBookingForModal.gstAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Amount:</span>
                <span className="tabular-nums">{formatCurrency(selectedBookingForModal.totalAmount)}</span>
              </div>
            </div>

            {/* Status Timeline History */}
            <div>
              <h5 className="font-bold text-xs text-gray-900 mb-2 uppercase tracking-wider">
                Audit Timeline
              </h5>
              <div className="space-y-2 text-xs">
                {selectedBookingForModal.statusHistory.map((h, i) => (
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

            {/* Actions: Cancel if pending, or Review if completed */}
            <div className="pt-2 flex justify-end gap-3">
              {selectedBookingForModal.bookingStatus !== 'completed' &&
                selectedBookingForModal.bookingStatus !== 'cancelled' && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this booking?')) {
                        cancelBooking(selectedBookingForModal.id);
                        setSelectedBookingForModal(null);
                      }
                    }}
                    className="px-4 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50"
                  >
                    Cancel Booking
                  </button>
                )}

              {selectedBookingForModal.bookingStatus === 'completed' && (
                <button
                  onClick={() => {
                    setReviewModalBooking(selectedBookingForModal);
                    setSelectedBookingForModal(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Leave Vehicle Review</span>
                </button>
              )}

              <button
                onClick={() => setSelectedBookingForModal(null)}
                className="px-4 py-2 bg-[#111827] text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              Rate your rental of {reviewModalBooking.vehicleName}
            </h3>
            
            {reviewSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold">
                Thank you! Your verified review has been posted.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 py-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details on vehicle cleanliness, performance and pickup..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  rows={3}
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setReviewModalBooking(null)}
                    className="px-4 py-2 border border-gray-200 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setReviewSubmitted(true);
                      setTimeout(() => {
                        setReviewModalBooking(null);
                        setReviewSubmitted(false);
                      }, 1000);
                    }}
                    className="px-4 py-2 bg-[#111827] text-[#C7F36B] text-xs font-bold rounded-xl"
                  >
                    Submit Review
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
