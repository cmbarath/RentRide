'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Percent,
  Trash2,
  Check,
  TrendingUp,
  Wrench,
  Save,
  Loader2,
  AlertCircle,
  X,
  Edit2,
} from 'lucide-react';

export const AdminPricing: React.FC = () => {
  const {
    vehicles,
    blockedDates,
    addBlockedDate,
    updateBlockedDate,
    deleteBlockedDate,
    pricingRule,
    refreshPricingRules,
    setWeekendSurgePercent,
    setGstRate,
    formatCurrency,
    formatDisplayDate,
  } = useApp();

  const [weekendSurgeEnabled, setWeekendSurgeEnabled] = useState(true);
  const [localSurgePercent, setLocalSurgePercent] = useState(pricingRule.weekendSurgePercent ?? 15);
  const [localGstRate, setLocalGstRate] = useState(pricingRule.gstPercentage ?? 18);
  const [doorstepFee, setDoorstepFee] = useState(pricingRule.doorstepDeliveryFee ?? 299);
  const [carInsuranceFee, setCarInsuranceFee] = useState(pricingRule.carInsuranceFee ?? 499);
  const [bikeInsuranceFee, setBikeInsuranceFee] = useState(pricingRule.bikeInsuranceFee ?? 199);

  const [selectedVehicleForBlock, setSelectedVehicleForBlock] = useState(vehicles[0]?.id || '');
  const [blockStartDate, setBlockStartDate] = useState('2026-11-15');
  const [blockEndDate, setBlockEndDate] = useState('2026-11-18');
  const [blockReason, setBlockReason] = useState<'maintenance' | 'vip_reservation' | 'inspection' | 'relocation'>('maintenance');
  const [blockNotes, setBlockNotes] = useState('Periodic 20,000 km brake pad & engine oil servicing');

  const [isSavingRule, setIsSavingRule] = useState(false);
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setLocalSurgePercent(pricingRule.weekendSurgePercent ?? 15);
    setWeekendSurgeEnabled((pricingRule.weekendSurgePercent ?? 15) > 0);
    setLocalGstRate(pricingRule.gstPercentage ?? 18);
    setDoorstepFee(pricingRule.doorstepDeliveryFee ?? 299);
    setCarInsuranceFee(pricingRule.carInsuranceFee ?? 499);
    setBikeInsuranceFee(pricingRule.bikeInsuranceFee ?? 199);
  }, [pricingRule]);

  useEffect(() => {
    if (!selectedVehicleForBlock && vehicles[0]?.id) {
      setSelectedVehicleForBlock(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleForBlock]);

  const sampleVehicle = vehicles.find((v) => v.type === 'bike') || vehicles[0];
  const sampleDailyRate = sampleVehicle?.pricePerDay || 1199;
  const effectiveSurge = weekendSurgeEnabled ? localSurgePercent : 0;

  const handleSavePricingRule = async () => {
    setIsSavingRule(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/pricing/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pricingRule.id,
          ruleName: pricingRule.ruleName || 'Tamil Nadu Standard Statutory Pricing',
          targetType: 'all',
          weekendSurgePercent: effectiveSurge,
          gstPercentage: localGstRate,
          doorstepDeliveryFee: Number(doorstepFee),
          carInsuranceFee: Number(carInsuranceFee),
          bikeInsuranceFee: Number(bikeInsuranceFee),
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', message: data.error || 'Failed to save pricing configuration.' });
      } else {
        setWeekendSurgePercent(effectiveSurge);
        setGstRate(localGstRate);
        await refreshPricingRules();
        setFeedback({ type: 'success', message: 'Dynamic pricing & GST rules saved to Supabase.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while saving pricing rules.' });
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForBlock) {
      setFeedback({ type: 'error', message: 'Please select a vehicle to schedule maintenance.' });
      return;
    }
    if (new Date(blockEndDate) < new Date(blockStartDate)) {
      setFeedback({ type: 'error', message: 'Maintenance end date must be on or after the start date.' });
      return;
    }

    setIsSavingBlock(true);
    setFeedback(null);

    const res = editingBlockId
      ? await updateBlockedDate(editingBlockId, {
          startDate: blockStartDate,
          endDate: blockEndDate,
          reason: blockReason,
          notes: blockNotes,
        })
      : await addBlockedDate({
          vehicleId: selectedVehicleForBlock,
          startDate: blockStartDate,
          endDate: blockEndDate,
          reason: blockReason,
          notes: blockNotes,
        });

    setIsSavingBlock(false);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to save calendar blackout.' });
    } else {
      setFeedback({
        type: 'success',
        message: editingBlockId
          ? 'Maintenance blackout updated in database.'
          : 'Maintenance blackout saved to database.',
      });
      setEditingBlockId(null);
    }
  };

  const handleStartEditBlock = (blockId: string) => {
    const target = blockedDates.find((b) => b.id === blockId);
    if (!target) return;
    setEditingBlockId(target.id);
    setSelectedVehicleForBlock(target.vehicleId);
    setBlockStartDate(target.startDate);
    setBlockEndDate(target.endDate);
    setBlockReason(target.reason);
    setBlockNotes(target.notes || '');
  };

  const handleCompleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId);
    setFeedback(null);
    const res = await updateBlockedDate(blockId, { isCompleted: true });
    setDeletingBlockId(null);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to complete maintenance block.' });
    } else {
      setFeedback({ type: 'success', message: 'Maintenance marked completed & vehicle availability restored.' });
      if (editingBlockId === blockId) setEditingBlockId(null);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId);
    setFeedback(null);
    const res = await deleteBlockedDate(blockId);
    setDeletingBlockId(null);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Failed to remove maintenance block.' });
    } else {
      setFeedback({ type: 'success', message: 'Maintenance blackout removed.' });
      if (editingBlockId === blockId) setEditingBlockId(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Pricing Rules, Availability & Calendar Blackouts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure dynamic weekend surge rates, Tamil Nadu GST breakdown, and schedule vehicle maintenance dates.
          </p>
        </div>

        <button
          type="button"
          disabled={isSavingRule}
          onClick={handleSavePricingRule}
          className="px-4 py-2.5 bg-[#111827] hover:bg-black disabled:opacity-60 text-[#C7F36B] rounded-xl text-xs font-bold shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          {isSavingRule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSavingRule ? 'Saving Rules...' : 'Save Pricing Configuration'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid: 2 Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Dynamic Pricing & Weekend Surge */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Dynamic Weekend Surge</h2>
                <p className="text-xs text-gray-400">Friday to Sunday peak rental multiplier</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={weekendSurgeEnabled}
                onChange={(e) => setWeekendSurgeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111827]"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-gray-700">Surge Markup Rate</span>
                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded font-mono">
                  +{effectiveSurge}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                disabled={!weekendSurgeEnabled}
                value={localSurgePercent}
                onChange={(e) => setLocalSurgePercent(Number(e.target.value))}
                className="w-full accent-[#111827] cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0% (Standard)</span>
                <span>15% (Recommended)</span>
                <span>40% (Peak Season)</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1">
              <div className="font-semibold text-gray-900">Live Fleet Sample Preview:</div>
              <div className="flex justify-between">
                <span>{sampleVehicle?.name || 'Sample Fleet Vehicle'} (Weekday):</span>
                <span className="font-mono font-bold">{formatCurrency(sampleDailyRate)}/day</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>{sampleVehicle?.name || 'Sample Fleet Vehicle'} (Weekend +{effectiveSurge}%):</span>
                <span className="font-mono">
                  {formatCurrency(Math.round(sampleDailyRate * (1 + effectiveSurge / 100)))}/day
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Tamil Nadu GST Tax & Fee Rules */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900">Tamil Nadu GST & Ancillary Fees</h2>
              <p className="text-xs text-gray-400">Statutory tax calculation, delivery & protection fees</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Applicable GST Rate (%)
              </label>
              <select
                value={localGstRate}
                onChange={(e) => setLocalGstRate(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900"
              >
                <option value={18}>18% GST (Standard Commercial Self-Drive Rental)</option>
                <option value={12}>12% GST (Concessional EV Mobility Rate)</option>
                <option value={28}>28% GST (Luxury Supercar / Premium Class)</option>
                <option value={0}>0% GST (Exempt / Special Economic Zone)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Doorstep Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={doorstepFee}
                  onChange={(e) => setDoorstepFee(Number(e.target.value))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Car Protection (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={carInsuranceFee}
                  onChange={(e) => setCarInsuranceFee(Number(e.target.value))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Bike Protection (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={bikeInsuranceFee}
                  onChange={(e) => setBikeInsuranceFee(Number(e.target.value))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block text-[11px]">Central GST (CGST)</span>
                <span className="text-sm font-bold text-gray-900 font-mono">{(localGstRate / 2).toFixed(1)}%</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-gray-400 block text-[11px]">State GST (SGST - TN)</span>
                <span className="text-sm font-bold text-gray-900 font-mono">{(localGstRate / 2).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Maintenance / Blackout Date Blocker */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#111827]" />
            <span>Schedule Maintenance & Fleet Blackout Dates</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Block vehicles from customer availability during scheduled service, repairs or VIP bookings.
          </p>
        </div>

        <form onSubmit={handleCreateBlock} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Target Vehicle</label>
            <select
              value={selectedVehicleForBlock}
              onChange={(e) => setSelectedVehicleForBlock(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Block Start Date</label>
            <input
              type="date"
              value={blockStartDate}
              onChange={(e) => setBlockStartDate(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Block End Date</label>
            <input
              type="date"
              value={blockEndDate}
              onChange={(e) => setBlockEndDate(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Reason for Block</label>
            <select
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value as any)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <option value="maintenance">Periodic Maintenance / Oil Service</option>
              <option value="inspection">RTO Fitness & Pollution Inspection</option>
              <option value="vip_reservation">Executive / VIP Reserved</option>
              <option value="relocation">Inter-Hub Relocation Transit</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="font-semibold text-gray-700 block mb-1">Service Notes</label>
            <input
              type="text"
              value={blockNotes}
              onChange={(e) => setBlockNotes(e.target.value)}
              placeholder="e.g. Authorized dealership 20,000 km general service"
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex items-end gap-2">
            {editingBlockId && (
              <button
                type="button"
                onClick={() => {
                  setEditingBlockId(null);
                  setBlockNotes('Periodic 20,000 km brake pad & engine oil servicing');
                }}
                className="px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSavingBlock}
              className="flex-1 py-2 bg-[#111827] text-[#C7F36B] hover:bg-black disabled:opacity-60 font-bold rounded-lg shadow-sm cursor-pointer"
            >
              {isSavingBlock
                ? 'Saving...'
                : editingBlockId
                ? 'Save Blackout Changes'
                : 'Block Availability'}
            </button>
          </div>
        </form>

        {/* Active Blocks List */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-bold text-xs text-gray-800 mb-3">Active Blackout & Maintenance Schedule</h3>
          {blockedDates.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">
              No active vehicle blocks. All {vehicles.length} vehicles are following standard booking calendar availability.
            </p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((b) => {
                const vehicle = vehicles.find((v) => v.id === b.vehicleId);
                return (
                  <div
                    key={b.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <span className="font-bold text-gray-900">{vehicle?.name || b.vehicleId}</span>
                      <span className="text-gray-400 ml-2 font-mono">
                        ({vehicle?.registrationNumber || 'Fleet Unit'})
                      </span>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {formatDisplayDate(b.startDate)} → {formatDisplayDate(b.endDate)} · <span className="capitalize">{b.reason}</span>: {b.notes}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditBlock(b.id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer"
                        title="Edit maintenance block"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingBlockId === b.id}
                        onClick={() => handleCompleteBlock(b.id)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 rounded-lg cursor-pointer"
                        title="Mark maintenance completed"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingBlockId === b.id}
                        onClick={() => handleDeleteBlock(b.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg cursor-pointer"
                        title="Delete maintenance block"
                      >
                        {deletingBlockId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
