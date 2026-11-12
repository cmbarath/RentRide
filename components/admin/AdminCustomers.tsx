'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Customer, LicenceVerificationStatus } from '@/types';
import {
  Search,
  X,
  Eye,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
  const [rejectReason, setRejectReason] = useState('');
  const [isUpdatingKyc, setIsUpdatingKyc] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [licenceDetail, setLicenceDetail] = useState<{
    licenceNumber: string | null;
    frontUrl: string | null;
    backUrl: string | null;
    loading: boolean;
  }>({ licenceNumber: null, frontUrl: null, backUrl: null, loading: false });

  useEffect(() => {
    if (!selectedCustomer?.id) {
      setLicenceDetail({ licenceNumber: null, frontUrl: null, backUrl: null, loading: false });
      return;
    }
    let cancelled = false;
    setRejectReason(selectedCustomer.rejectionReason || '');
    setLicenceDetail({
      licenceNumber: selectedCustomer.licenceNumber || null,
      frontUrl: null,
      backUrl: null,
      loading: true,
    });
    fetch(`/api/customers/${encodeURIComponent(selectedCustomer.id)}/licence`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success) {
          setLicenceDetail({
            licenceNumber: data.licence?.licenceNumber || selectedCustomer.licenceNumber || null,
            frontUrl: data.signedUrls?.front || null,
            backUrl: data.signedUrls?.back || null,
            loading: false,
          });
        } else {
          setLicenceDetail((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) setLicenceDetail((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCustomer]);

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

  const getCustomerBookings = (customer: Customer) => {
    return bookings.filter((b) => b.customerId === customer.id || b.customerEmail === customer.email);
  };

  const handleKycDecision = async (status: 'verified' | 'rejected') => {
    if (!selectedCustomer) return;
    setIsUpdatingKyc(true);
    setFeedback(null);
    const res = await verifyLicence(
      selectedCustomer.id,
      status,
      status === 'rejected' ? rejectReason.trim() || 'Document unclear or invalid' : undefined
    );
    setIsUpdatingKyc(false);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to update KYC status.' });
    } else {
      setFeedback({
        type: 'success',
        message: `${selectedCustomer.name} driving licence ${status === 'verified' ? 'approved' : 'rejected'}.`,
      });
      setSelectedCustomer(null);
    }
  };

  const verifiedCount = customers.filter((c) => c.licenceStatus === 'verified').length;
  const pendingCount = customers.filter((c) => c.licenceStatus === 'pending').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Customer Accounts & KYC Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit customer identities, manage driving licence verification, and review rental histories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold">Total Renters: {customers.length}</span>
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

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Total Registered Renters</div>
          <div className="text-2xl font-black text-gray-900">{customers.length}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Across Tamil Nadu</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Verified KYC Renters</div>
          <div className="text-2xl font-black text-emerald-600">{verifiedCount}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Authorized for instant vehicle release</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Pending DL Audits</div>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Licences awaiting staff review</p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, phone..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* KYC Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold">
            {(
              [
                { id: 'all', label: 'All Renters' },
                { id: 'verified', label: 'Verified KYC' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setKycFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  kycFilter === tab.id
                    ? 'bg-[#111827] text-[#C7F36B] shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-200">
              <tr>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Contact Information</th>
                <th className="py-3 px-3">Driving Licence No.</th>
                <th className="py-3 px-3">KYC Status</th>
                <th className="py-3 px-3">Lifetime Bookings</th>
                <th className="py-3 px-3">Total Spend</th>
                <th className="py-3 px-3">Member Since</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#111827] text-[#C7F36B] flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block leading-tight">{c.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{c.id.slice(0, 12)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-gray-800 font-medium">{c.phone}</div>
                      <div className="text-[11px] text-gray-400">{c.email}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-gray-800">
                      {c.licenceNumber || 'Not submitted'}
                    </td>
                    <td className="py-3 px-3">
                      {c.licenceStatus === 'verified' ? (
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          Verified
                        </span>
                      ) : c.licenceStatus === 'rejected' ? (
                        <span className="bg-red-50 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                          Rejected
                        </span>
                      ) : c.licenceStatus === 'pending' ? (
                        <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          Pending Audit
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      {getCustomerBookings(c).length || c.totalBookings} trips
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {c.joinedDate}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Audit Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#C7F36B] text-[#111827] flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{selectedCustomer.name}</h3>
                  <p className="text-xs text-gray-400">{selectedCustomer.email} · {selectedCustomer.phone}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <div>
                  <span className="text-gray-400 block text-[10px]">Total Trips</span>
                  <span className="font-bold text-sm text-gray-900">
                    {getCustomerBookings(selectedCustomer).length || selectedCustomer.totalBookings}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Lifetime Spend</span>
                  <span className="font-bold text-sm text-emerald-700">{formatCurrency(selectedCustomer.totalSpent)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Renter Rating</span>
                  <span className="font-bold text-sm text-amber-600 flex items-center justify-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{selectedCustomer.rating}</span>
                  </span>
                </div>
              </div>

              {/* Driving Licence KYC Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900">Submitted Driving Licence</h4>
                  <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {licenceDetail.licenceNumber || 'Not Submitted'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-xl overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
                    {licenceDetail.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : licenceDetail.frontUrl ? (
                      <img src={licenceDetail.frontUrl} alt="DL Front" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-400 px-2 text-center">No front DL image uploaded</span>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
                    {licenceDetail.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : licenceDetail.backUrl ? (
                      <img src={licenceDetail.backUrl} alt="DL Back" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-gray-400 px-2 text-center">No back DL image uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Bookings History */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-gray-900">Rental History</h4>
                {getCustomerBookings(selectedCustomer).length === 0 ? (
                  <p className="text-gray-400 bg-gray-50 rounded-lg p-3 text-center">No bookings recorded yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {getCustomerBookings(selectedCustomer).map((bk) => (
                      <div
                        key={bk.id}
                        className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div>
                          <span className="font-bold text-gray-900">{bk.vehicleName}</span>
                          <span className="text-gray-400 ml-2 font-mono">{bk.id}</span>
                          <div className="text-[10px] text-gray-500">
                            {formatDisplayDate(bk.pickupDate)} → {formatDisplayDate(bk.returnDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block">{formatCurrency(bk.totalAmount)}</span>
                          <span className="text-[10px] capitalize text-gray-500">{bk.bookingStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Rejection Reason */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  KYC Audit Note / Rejection Reason (if rejecting)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Expired licence, blurry photo"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              {/* KYC Decisions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isUpdatingKyc}
                  onClick={() => handleKycDecision('rejected')}
                  className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-xl font-bold cursor-pointer"
                >
                  Reject Licence
                </button>
                <button
                  type="button"
                  disabled={isUpdatingKyc}
                  onClick={() => handleKycDecision('verified')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isUpdatingKyc && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Verify & Approve KYC</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
