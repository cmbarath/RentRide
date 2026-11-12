import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction } from '../../types';
import {
  CreditCard,
  Search,
  ArrowUpRight,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  X,
  Printer,
  Car,
} from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const { transactions, formatCurrency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedTxnForReceipt, setSelectedTxnForReceipt] = useState<Transaction | null>(null);

  // Financial aggregates
  const totalRevenue = transactions
    .filter((t) => t.status === 'success' && t.type === 'rental_charge')
    .reduce((sum, t) => sum + t.amount, 0);

  const securityDepositsHeld = transactions
    .filter((t) => t.status === 'success' && t.type === 'security_deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = transactions
    .filter((t) => t.status === 'refunded' || t.type === 'deposit_refund')
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

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Revenue & Financial Transactions
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit gateway settlements, UPI & card charges, security deposit escrows, and customer refunds.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting full FY 2026-27 ledger as CSV spreadsheet...')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Financial Ledger</span>
        </button>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Rental Revenue</p>
          <p className="text-2xl font-black text-gray-900 mt-1 tabular-nums">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Processed via gateway</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deposits Escrow Held</p>
          <p className="text-2xl font-black text-blue-600 mt-1 tabular-nums">{formatCurrency(securityDepositsHeld || 14500)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Held during active rentals</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Refunds Processed</p>
          <p className="text-2xl font-black text-purple-600 mt-1 tabular-nums">{formatCurrency(totalRefunds || 4000)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Auto-refunded on return</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gateway Success Rate</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">99.4%</p>
          <p className="text-[11px] text-gray-500 mt-1">UPI & 3D Secure 2.0</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Method filter */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl text-xs font-bold w-full sm:w-auto">
          {['all', 'UPI', 'Credit Card', 'Debit Card', 'NetBanking'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                methodFilter === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {m === 'all' ? 'All Channels' : m}
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
            placeholder="Search txn ID, booking, customer..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Channel / Method</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {t.id}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                      {t.bookingId}
                    </td>

                    <td className="py-3.5 px-4 text-gray-800 font-medium">
                      {t.customerName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {t.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {t.transactionDate}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900 tabular-nums">
                      {formatCurrency(t.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-gray-500 capitalize">
                      {t.type.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        t.status === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : t.status === 'refunded'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTxnForReceipt(t)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-[11px]"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-400">
            No transactions match this criteria.
          </div>
        )}
      </div>

      {/* Digital Receipt / Tax Invoice Modal */}
      {selectedTxnForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-gray-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-900" />
                <h3 className="font-extrabold text-base text-gray-900">Digital Tax Invoice</h3>
              </div>
              <button onClick={() => setSelectedTxnForReceipt(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center pb-2">
              <p className="font-extrabold text-lg text-gray-900">RentRide Mobility Pvt. Ltd.</p>
              <p className="text-[10px] text-gray-400">GSTIN: 29AABCU9603R1ZM · CIN: U63090KA2024PTC180291</p>
              <p className="text-[10px] text-gray-400">Indiranagar 100ft Road, Bengaluru, Karnataka - 560038</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice No:</span>
                <span className="font-mono font-bold text-gray-900">INV-2026-{selectedTxnForReceipt.id.replace('TXN-', '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Reference:</span>
                <span className="font-mono font-bold text-gray-900">{selectedTxnForReceipt.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900">{selectedTxnForReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Channel:</span>
                <span className="font-semibold text-gray-900">{selectedTxnForReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Settlement Date:</span>
                <span className="font-semibold text-gray-900">{selectedTxnForReceipt.transactionDate}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-200">
                <span>Amount Paid:</span>
                <span className="tabular-nums font-black">{formatCurrency(selectedTxnForReceipt.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={() => setSelectedTxnForReceipt(null)}
                className="px-4 py-2 bg-[#111827] text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
