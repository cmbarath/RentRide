import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  CalendarCheck,
  Car,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  Check,
  X,
  Bike,
  CreditCard,
} from 'lucide-react';

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

  // Key Metrics
  const totalRevenue = transactions
    .filter((t) => t.status === 'success' && t.type === 'rental_charge')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBookings = bookings.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const currentlyRented = vehicles.filter((v) => v.status === 'rented' || v.status === 'booked').length;
  const pendingApprovals = bookings.filter(
    (b) => b.bookingStatus === 'awaiting_licence' || b.bookingStatus === 'submitted'
  );
  const totalCustomers = customers.length;
  const carCount = vehicles.filter((v) => v.type === 'car').length;
  const bikeCount = vehicles.filter((v) => v.type === 'bike').length;
  const carBookings = bookings.filter((b) => b.vehicleType === 'car').length;
  const bikeBookings = bookings.filter((b) => b.vehicleType === 'bike').length;
  const carRatio = Math.round((carBookings / (carBookings + bikeBookings || 1)) * 100);

  const fleetUtilisation = Math.round((currentlyRented / (vehicles.length || 1)) * 100);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Fleet Operations & Revenue Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time telemetry, rental approvals, and vehicle utilization across all hubs.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm text-xs font-bold self-start sm:self-auto">
          {(['today', 'week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDateFilter(period)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
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

      {/* 7 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Revenue</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] flex items-center">
              +18.4% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2 tabular-nums">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">₹42.8k collected this month</p>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium block">Total Bookings</span>
          <div className="text-xl font-black text-gray-900 mt-2 tabular-nums">{totalBookings}</div>
          <p className="text-[11px] text-gray-400 mt-1">Across 4 hubs</p>
        </div>

        {/* Total Vehicles */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium block">Total Fleet</span>
          <div className="text-xl font-black text-gray-900 mt-2 tabular-nums">{vehicles.length}</div>
          <p className="text-[11px] text-gray-400 mt-1">{carCount} Cars · {bikeCount} Bikes</p>
        </div>

        {/* Available Vehicles */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium block">Available Now</span>
          <div className="text-xl font-black text-emerald-600 mt-2 tabular-nums">{availableVehicles}</div>
          <p className="text-[11px] text-gray-400 mt-1">Ready for pickup</p>
        </div>

        {/* Currently Rented */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium block">On Rent / Booked</span>
          <div className="text-xl font-black text-blue-600 mt-2 tabular-nums">{currentlyRented}</div>
          <p className="text-[11px] text-gray-400 mt-1">{fleetUtilisation}% fleet utilized</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium block">Pending KYC</span>
          <div className="text-xl font-black text-amber-600 mt-2 tabular-nums">{pendingApprovals.length}</div>
          <p className="text-[11px] text-gray-400 mt-1">Requires review</p>
        </div>
      </div>

      {/* Analytics Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Revenue Trends (Monthly SVG Bar & Line Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Revenue & Rental Trends</h3>
              <p className="text-xs text-gray-400">Monthly gross rental volume vs. target (in ₹ thousands)</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#111827]"></span>
                <span>Cars</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#C7F36B]"></span>
                <span>Bikes</span>
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-64 w-full pt-4">
            <svg className="w-full h-full" viewBox="0 0 600 200">
              {/* Grid lines */}
              <line x1="40" y1="30" x2="580" y2="30" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="40" y1="75" x2="580" y2="75" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="40" y1="120" x2="580" y2="120" stroke="#F1F5F9" strokeDasharray="4 4" />
              <line x1="40" y1="165" x2="580" y2="165" stroke="#E2E8F0" />

              {/* Y Axis Labels */}
              <text x="32" y="34" fontSize="10" fill="#94A3B8" textAnchor="end">₹120k</text>
              <text x="32" y="79" fontSize="10" fill="#94A3B8" textAnchor="end">₹80k</text>
              <text x="32" y="124" fontSize="10" fill="#94A3B8" textAnchor="end">₹40k</text>
              <text x="32" y="169" fontSize="10" fill="#94A3B8" textAnchor="end">0</text>

              {/* Bars per Month */}
              {/* Jun */}
              <rect x="75" y="85" width="22" height="80" rx="3" fill="#111827" />
              <rect x="100" y="125" width="22" height="40" rx="3" fill="#C7F36B" />
              <text x="98" y="185" fontSize="11" fill="#64748B" textAnchor="middle">Jun</text>

              {/* Jul */}
              <rect x="160" y="65" width="22" height="100" rx="3" fill="#111827" />
              <rect x="185" y="115" width="22" height="50" rx="3" fill="#C7F36B" />
              <text x="183" y="185" fontSize="11" fill="#64748B" textAnchor="middle">Jul</text>

              {/* Aug */}
              <rect x="245" y="55" width="22" height="110" rx="3" fill="#111827" />
              <rect x="270" y="105" width="22" height="60" rx="3" fill="#C7F36B" />
              <text x="268" y="185" fontSize="11" fill="#64748B" textAnchor="middle">Aug</text>

              {/* Sep */}
              <rect x="330" y="50" width="22" height="115" rx="3" fill="#111827" />
              <rect x="355" y="95" width="22" height="70" rx="3" fill="#C7F36B" />
              <text x="353" y="185" fontSize="11" fill="#64748B" textAnchor="middle">Sep</text>

              {/* Oct */}
              <rect x="415" y="40" width="22" height="125" rx="3" fill="#111827" />
              <rect x="440" y="90" width="22" height="75" rx="3" fill="#C7F36B" />
              <text x="438" y="185" fontSize="11" fill="#64748B" textAnchor="middle">Oct</text>

              {/* Nov (Current) */}
              <rect x="500" y="32" width="22" height="133" rx="3" fill="#111827" />
              <rect x="525" y="80" width="22" height="85" rx="3" fill="#C7F36B" />
              <text x="523" y="185" fontSize="11" fill="#111827" fontWeight="bold" textAnchor="middle">Nov</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Distribution & Fleet Utilisation */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Vehicle Utilization & Category</h3>
            <p className="text-xs text-gray-400">Demand split between self-drive cars and bikes</p>
          </div>

          {/* Progress / Donut breakdown */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>Self-Drive Cars</span>
                </span>
                <span className="tabular-nums font-mono">{carRatio}% of bookings</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#111827] rounded-full"
                  style={{ width: `${carRatio}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                <span className="flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5" />
                  <span>Bikes & Scooters</span>
                </span>
                <span className="tabular-nums font-mono">{100 - carRatio}% of bookings</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C7F36B] rounded-full"
                  style={{ width: `${100 - carRatio}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                <span>Total Fleet Utilization</span>
                <span className="text-emerald-700 tabular-nums">{fleetUtilisation}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${fleetUtilisation}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {currentlyRented} vehicles active out of {vehicles.length} in fleet.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Pending Approval Requests (Instant Action Bar) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Pending Booking & Licence Approvals
              </h3>
              <p className="text-xs text-gray-400">
                Review driving licences and authorize customer payments
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminScreen('bookings')}
            className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1"
          >
            <span>View All ({pendingApprovals.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingApprovals.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {pendingApprovals.map((b) => (
              <div
                key={b.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={b.vehicleImage}
                    alt=""
                    className="w-14 h-12 object-cover rounded-lg bg-gray-100"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900">{b.id}</span>
                      <span className="text-gray-300">·</span>
                      <span className="font-bold text-xs text-gray-800">{b.customerName}</span>
                      <span className="text-[11px] font-mono text-gray-500">({b.customerPhone})</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Renting: <strong>{b.vehicleName}</strong> · {formatDisplayDate(b.pickupDate)} ({b.durationDays} days)
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Licence No: {b.licenceNumber || 'KA-03-2019-0048192'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <span className="font-bold text-xs text-gray-900 tabular-nums">
                    {formatCurrency(b.totalAmount)}
                  </span>

                  <button
                    onClick={() => approveBooking(b.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason for customer notification:', 'Driving licence expired or blurred');
                      if (reason) rejectBooking(b.id, reason);
                    }}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-gray-50 rounded-xl text-center text-xs text-gray-400">
            All customer bookings and licences are up to date! Zero backlog.
          </div>
        )}
      </div>

      {/* Bottom 2 Split: Recent Bookings & Most Rented Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Bookings Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Recent Customer Bookings</h3>
            <button
              onClick={() => setAdminScreen('bookings')}
              className="text-xs font-bold text-gray-600 hover:text-black"
            >
              See All →
            </button>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {bookings.slice(0, 4).map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{b.id}</span>
                    <span className="text-gray-300">·</span>
                    <span className="font-semibold text-gray-800">{b.customerName}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{b.vehicleName}</p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-gray-900 block tabular-nums">
                    {formatCurrency(b.totalAmount)}
                  </span>
                  <span className="text-[10px] text-gray-400 capitalize">{b.bookingStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Rented Vehicles */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Top Performing Fleet Assets</h3>
            <button
              onClick={() => setAdminScreen('vehicles')}
              className="text-xs font-bold text-gray-600 hover:text-black"
            >
              Manage Fleet →
            </button>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {vehicles.slice(0, 4).map((v) => (
              <div key={v.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={v.coverImage} alt="" className="w-12 h-10 object-cover rounded-md bg-gray-100" />
                  <div>
                    <span className="font-bold text-gray-900 block">{v.name}</span>
                    <span className="text-[11px] text-gray-500">
                      {v.registrationNumber} · {v.type === 'car' ? 'Car' : 'Bike'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-gray-900 block tabular-nums">
                    {formatCurrency(v.pricePerDay)}/d
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">{v.reviewCount} trips</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
