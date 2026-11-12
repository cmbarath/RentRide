import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, LicenceVerificationStatus } from '../../types';
import {
  Users,
  Search,
  ShieldCheck,
  Check,
  X,
  Eye,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Car,
  Star,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AdminCustomers: React.FC = () => {
  const {
    customers,
    verifyLicence,
    bookings,
    formatCurrency,
    formatDisplayDate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState<'all' | LicenceVerificationStatus>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    if (kycFilter !== 'all' && c.licenceStatus !== kycFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCustomerBookings = (customerId: string) => {
    return bookings.filter((b) => b.customerId === customerId || b.customerEmail === selectedCustomer?.email);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Customer Accounts & KYC Management
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verify customer driving licences, manage renter standing, and review lifetime rental expenditure.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* KYC Filter */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl text-xs font-bold w-full sm:w-auto">
          {(['all', 'verified', 'pending', 'unverified'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setKycFilter(filter)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                kycFilter === filter
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, phone, ID..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Customer ID & Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Driving Licence KYC</th>
                  <th className="py-3 px-4">Total Trips</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Account Standing</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#111827] text-[#C7F36B] font-bold flex items-center justify-center shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{c.name}</span>
                          <span className="font-mono text-[10px] text-gray-400">{c.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      <div>{c.email}</div>
                      <div className="font-mono text-[11px] text-gray-400">{c.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {c.joinedDate}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        c.licenceStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : c.licenceStatus === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {c.licenceStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                      {c.totalBookings}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900 tabular-nums">
                      {formatCurrency(c.totalSpent)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded capitalize">
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-400">
            No customers match this filter.
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#111827] text-[#C7F36B] font-bold text-lg flex items-center justify-center">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedCustomer.id} · Joined {selectedCustomer.joinedDate}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Total Trips</p>
                <p className="text-xl font-black text-gray-900 mt-1">{selectedCustomer.totalBookings}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Total Spending</p>
                <p className="text-xl font-black text-gray-900 mt-1 tabular-nums">{formatCurrency(selectedCustomer.totalSpent)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Renter Rating</p>
                <p className="text-xl font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{selectedCustomer.rating.toFixed(1)}</span>
                </p>
              </div>
            </div>

            {/* Driving Licence KYC Verification Section */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-gray-900">Driving Licence Document</h4>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {selectedCustomer.licenceNumber || 'KA-03-2019-0048192'}
                  </p>
                </div>
                <span className="text-xs font-bold capitalize px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Status: {selectedCustomer.licenceStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <img
                  src="/src/assets/images/hero_automotive_duo_1793632402154.jpg"
                  alt="Licence Front"
                  className="w-full h-28 object-cover rounded-lg border border-gray-200"
                />
                <img
                  src="/src/assets/images/car_creta_suv_1793632403661.jpg"
                  alt="Licence Back"
                  className="w-full h-28 object-cover rounded-lg border border-gray-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    verifyLicence(selectedCustomer.id, 'verified');
                    setSelectedCustomer((prev) => prev ? { ...prev, licenceStatus: 'verified' } : null);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Licence Verified</span>
                </button>
                <button
                  onClick={() => {
                    verifyLicence(selectedCustomer.id, 'rejected');
                    setSelectedCustomer((prev) => prev ? { ...prev, licenceStatus: 'rejected' } : null);
                  }}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject KYC</span>
                </button>
              </div>
            </div>

            {/* Booking History for this Customer */}
            <div>
              <h4 className="font-bold text-xs text-gray-900 mb-2 uppercase tracking-wider">
                Rental History ({getCustomerBookings(selectedCustomer.id).length} Trips)
              </h4>
              <div className="space-y-2 text-xs">
                {getCustomerBookings(selectedCustomer.id).map((b) => (
                  <div key={b.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-gray-900">{b.id}</span> · {b.vehicleName}
                      <p className="text-[11px] text-gray-400">
                        {formatDisplayDate(b.pickupDate)} → {formatDisplayDate(b.returnDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 tabular-nums">{formatCurrency(b.totalAmount)}</span>
                      <p className="text-[10px] text-emerald-700 font-semibold capitalize">{b.bookingStatus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-[#111827] text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
