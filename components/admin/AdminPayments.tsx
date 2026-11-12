'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentMethod, Transaction, TransactionType } from '@/types';
import {
  Search,
  CheckCircle2,
  RotateCcw,
  FileText,
  X,
  Printer,
  TrendingUp,
  Shield,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const {
    transactions,
    bookings,
    recordCounterPayment,
    pricingRule,
    formatCurrency,
    formatDisplayDate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedTxnForReceipt, setSelectedTxnForReceipt] = useState<Transaction | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Record Settlement form
  const unsettledBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.bookingStatus !== 'cancelled' && b.bookingStatus !== 'rejected' && b.paymentStatus !== 'paid'
      ),
    [bookings]
  );

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementMethod, setSettlementMethod] = useState<PaymentMethod>('Cash');
  const [settlementType, setSettlementType] = useState<TransactionType>('rental_charge');
  const [referenceNote, setReferenceNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openSettlementModal = () => {
    const first = unsettledBookings[0] || bookings[0];
    setModalError(null);
    setSelectedBookingId(first?.id || '');
    setSettlementAmount(first?.totalAmount || 0);
    setSettlementMethod('Cash');
    setSettlementType('rental_charge');
    setReferenceNote('');
    setIsSettlementModalOpen(true);
  };

  const handleBookingPick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    const matched = bookings.find((b) => b.id === bookingId);
    if (matched) {
      if (settlementType === 'security_deposit' || settlementType === 'deposit_refund') {
        setSettlementAmount(matched.securityDeposit || 0);
      } else {
        setSettlementAmount(matched.totalAmount || 0);
      }
    }
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setFeedback(null);

    if (!selectedBookingId) {
      setModalError('Please select a booking reference.');
      return;
    }
    if (!Number.isFinite(settlementAmount) || settlementAmount <= 0) {
      setModalError('Please enter a valid settlement amount greater than 0.');
      return;
    }

    setIsRecording(true);
    const res = await recordCounterPayment({
      bookingId: selectedBookingId,
      amount: Number(settlementAmount),
      paymentMethod: settlementMethod,
      type: settlementType,
      referenceNote: referenceNote.trim() || undefined,
    });
    setIsRecording(false);

    if (!res.success) {
      setModalError(res.error || 'Failed to record counter settlement.');
      return;
    }

    setFeedback({
      type: 'success',
      message: `Recorded ${settlementMethod} counter settlement (${formatCurrency(settlementAmount)}) for ${selectedBookingId}.`,
    });
    setIsSettlementModalOpen(false);
  };

  // Financial aggregates
  const totalRevenue = transactions
    .filter((t) => t.status === 'success' && (t.type === 'rental_charge' || t.type === 'late_fee'))
    .reduce((sum, t) => sum + t.amount, 0);

  const securityDepositsHeld = transactions
    .filter((t) => t.status === 'success' && t.type === 'security_deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = transactions
    .filter((t) => t.status === 'refunded' || t.type === 'deposit_refund' || t.type === 'cancellation_refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter((t) => {
    if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.bookingId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeGstRate = pricingRule.gstPercentage || 18;
  const gstMultiplier = 1 + activeGstRate / 100;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Counter Settlement & Billing Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Record Cash/UPI counter collections, reconcile security deposit escrows, and generate GST receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openSettlementModal}
            className="px-4 py-2 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Counter Settlement</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print</span>
          </button>
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
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Gross Counter Revenue</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900">{formatCurrency(totalRevenue)}</div>
          <p className="text-[11px] text-gray-400 mt-1">Settled at Mobility Hubs & Counters</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Security Deposits in Escrow</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Shield className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700">{formatCurrency(securityDepositsHeld)}</div>
          <p className="text-[11px] text-gray-400 mt-1">Refundable upon trip completion</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold">Refunds Processed</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900">{formatCurrency(totalRefunds)}</div>
          <p className="text-[11px] text-gray-400 mt-1">Returned to customer accounts</p>
        </div>
      </div>

      {/* Search & Ledger Table */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Txn ID, booking ID or customer..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* Payment Method filter */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold">
            {['all', 'Cash', 'UPI', 'Credit Card', 'Debit Card', 'NetBanking'].map((method) => (
              <button
                type="button"
                key={method}
                onClick={() => setMethodFilter(method)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  methodFilter === method
                    ? 'bg-[#111827] text-[#C7F36B] shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {method === 'all' ? 'All Channels' : method}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-200">
              <tr>
                <th className="py-3 px-3">Transaction ID</th>
                <th className="py-3 px-3">Booking Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Payment Channel</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Recorded Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3 text-right">Tax Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">
                    No counter settlement transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {t.id}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-blue-600">
                      {t.bookingId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{t.customerName}</div>
                      <div className="text-[10px] text-gray-400">{t.customerEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-gray-800">{t.paymentMethod}</span>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        Counter Verified
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-semibold text-gray-800">
                        {t.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {t.status === 'success' ? (
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          Captured
                        </span>
                      ) : t.status === 'refunded' ? (
                        <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                          Refunded
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {formatDisplayDate(t.transactionDate)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTxnForReceipt(t)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Counter Settlement Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Counter Payment Settlement</h3>
              <button type="button" onClick={() => setIsSettlementModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="p-6 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Booking Reference</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => handleBookingPick(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                  required
                >
                  <option value="">-- Select Booking --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.customerName} ({formatCurrency(b.totalAmount)} · {b.paymentStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Channel</label>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  >
                    <option value="Cash">Cash at Hub</option>
                    <option value="UPI">UPI QR / Counter</option>
                    <option value="Credit Card">POS Credit Card</option>
                    <option value="Debit Card">POS Debit Card</option>
                    <option value="NetBanking">Bank Transfer / NEFT</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Entry Type</label>
                  <select
                    value={settlementType}
                    onChange={(e) => setSettlementType(e.target.value as TransactionType)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  >
                    <option value="rental_charge">Rental Settlement</option>
                    <option value="security_deposit">Security Deposit</option>
                    <option value="deposit_refund">Deposit Refund</option>
                    <option value="cancellation_refund">Cancellation Refund</option>
                    <option value="late_fee">Late / Damage Fee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Collected Amount (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Counter Reference / Receipt Note</label>
                <input
                  type="text"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  placeholder="e.g. Paid via UPI Ref 4321... or Counter Cash Slip"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isRecording}
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecording}
                  className="px-5 py-2 bg-[#111827] text-[#C7F36B] font-bold rounded-xl hover:bg-black disabled:opacity-60 shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isRecording && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRecording ? 'Recording...' : 'Confirm Counter Settlement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedTxnForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-base text-gray-900">RentRide Tax Invoice</h3>
                <p className="text-xs text-gray-400">GSTIN: 33AABCR8721K1ZM (Tamil Nadu)</p>
              </div>
              <button type="button" onClick={() => setSelectedTxnForReceipt(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="font-mono font-bold text-gray-900">{selectedTxnForReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Reference:</span>
                <span className="font-mono font-bold text-blue-600">{selectedTxnForReceipt.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Billed To:</span>
                <span className="font-semibold text-gray-900">{selectedTxnForReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Channel:</span>
                <span className="font-semibold text-gray-900">{selectedTxnForReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recorded At:</span>
                <span className="text-gray-700">{formatDisplayDate(selectedTxnForReceipt.transactionDate)}</span>
              </div>

              <div className="border-t border-b border-gray-100 py-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxable Base Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(Math.round(selectedTxnForReceipt.amount / gstMultiplier))}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>CGST ({(activeGstRate / 2).toFixed(1)}%):</span>
                  <span>
                    {formatCurrency(Math.round((selectedTxnForReceipt.amount - selectedTxnForReceipt.amount / gstMultiplier) / 2))}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>SGST - Tamil Nadu ({(activeGstRate / 2).toFixed(1)}%):</span>
                  <span>
                    {formatCurrency(Math.round((selectedTxnForReceipt.amount - selectedTxnForReceipt.amount / gstMultiplier) / 2))}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
                <span>Total Counter Settlement:</span>
                <span className="text-emerald-700">{formatCurrency(selectedTxnForReceipt.amount)}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTxnForReceipt(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#111827] text-[#C7F36B] font-bold rounded-xl hover:bg-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
