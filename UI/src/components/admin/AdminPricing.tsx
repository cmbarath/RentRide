import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Tag,
  Calendar,
  Percent,
  ShieldAlert,
  MapPin,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  TrendingUp,
} from 'lucide-react';

export const AdminPricing: React.FC = () => {
  const {
    vehicles,
    hubs,
    blockedDates,
    addBlockedDate,
    deleteBlockedDate,
    weekendSurgePercent,
    setWeekendSurgePercent,
    gstRate,
    setGstRate,
    formatCurrency,
    formatDisplayDate,
  } = useApp();

  const [weekendSurgeEnabled, setWeekendSurgeEnabled] = useState(true);
  const [selectedVehicleForBlock, setSelectedVehicleForBlock] = useState(vehicles[0]?.id || 'veh-car-01');
  const [blockStartDate, setBlockStartDate] = useState('2026-11-15');
  const [blockEndDate, setBlockEndDate] = useState('2026-11-18');
  const [blockReason, setBlockReason] = useState<'maintenance' | 'vip_reservation' | 'inspection' | 'relocation'>('maintenance');
  const [blockNotes, setBlockNotes] = useState('Periodic 20,000 km brake pad & oil servicing');

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    addBlockedDate({
      vehicleId: selectedVehicleForBlock,
      startDate: blockStartDate,
      endDate: blockEndDate,
      reason: blockReason,
      notes: blockNotes,
    });
    alert('Date block added to fleet availability schedule.');
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Pricing Rules, Availability & Hubs
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure dynamic weekend surge rates, security deposit tiers, calendar maintenance blocks, and pickup hubs.
        </p>
      </div>

      {/* Top 3 Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Dynamic Weekend Surge */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lime-100 text-[#111827] flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4 text-emerald-800" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Weekend Surge Pricing</h3>
            </div>
            <input
              type="checkbox"
              checked={weekendSurgeEnabled}
              onChange={(e) => setWeekendSurgeEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-[#111827]"
            />
          </div>

          <p className="text-xs text-gray-500">
            Automatically applies multiplier to Friday evening through Sunday midnight rentals to optimize fleet yield.
          </p>

          <div className="pt-2">
            <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
              <span>Surge Percentage</span>
              <span className="text-emerald-700 font-mono">+{weekendSurgePercent}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              step={5}
              disabled={!weekendSurgeEnabled}
              value={weekendSurgePercent}
              onChange={(e) => setWeekendSurgePercent(Number(e.target.value))}
              className="w-full accent-[#111827]"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500">
            Example: A ₹3,200/day SUV rents at <strong>₹{Math.round(3200 * (1 + (weekendSurgeEnabled ? weekendSurgePercent : 0) / 100)).toLocaleString('en-IN')}/day</strong> on Saturdays.
          </div>
        </div>

        {/* 2. Tax & Legal Regulations */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Taxes & GST Configuration</h3>
          </div>

          <p className="text-xs text-gray-500">
            Government of India standardized motor rental vehicle GST classification (SAC Code: 996601).
          </p>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Standard GST Rate (%)</label>
            <select
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
            >
              <option value={18}>18% GST (Standard Commercial Car/Bike)</option>
              <option value={12}>12% GST (Concessional EV Mobility)</option>
              <option value={28}>28% GST (Luxury Supercar Segment)</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl text-[11px] text-blue-900">
            Automated tax invoices with B2B GSTIN compliance generated for all completed trips.
          </div>
        </div>

        {/* 3. Security Deposits & Add-ons */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Security Deposit Policy</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-medium">Hatchback / EV Scooters</span>
              <span className="font-bold text-gray-900">₹1,000</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-medium">Compact SUVs & Scramblers</span>
              <span className="font-bold text-gray-900">₹3,000</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
              <span className="font-medium">Luxury Sedans & 4x4s</span>
              <span className="font-bold text-gray-900">₹10,000</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 pt-1">
            * Refunds are processed instantly through automated payment gateway webhook upon return sign-off.
          </p>
        </div>

      </div>

      {/* Availability Calendar & Maintenance Blocking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Schedule Date Block Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span>Block Vehicle Dates / Service</span>
          </h3>

          <form onSubmit={handleCreateBlock} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Select Fleet Asset</label>
              <select
                value={selectedVehicleForBlock}
                onChange={(e) => setSelectedVehicleForBlock(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Block From</label>
                <input
                  type="date"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Block Till</label>
                <input
                  type="date"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Reason for Blackout</label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value as any)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
              >
                <option value="maintenance">Periodic Maintenance / Servicing</option>
                <option value="vip_reservation">Corporate VIP Offline Reservation</option>
                <option value="inspection">RTO Fitness / Insurance Inspection</option>
                <option value="relocation">Inter-Hub Hub Relocation</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Service Notes</label>
              <textarea
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#111827] text-[#C7F36B] font-bold text-xs rounded-xl hover:bg-black shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Calendar Blackout</span>
            </button>
          </form>
        </div>

        {/* Right: Active Date Blackouts Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Scheduled Date Blackouts & Maintenance</h3>
            <span className="text-xs font-bold text-gray-500 font-mono">
              {blockedDates.length} Active Rules
            </span>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {blockedDates.map((block) => {
              const targetVeh = vehicles.find((v) => v.id === block.vehicleId);
              return (
                <div key={block.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {targetVeh?.name || 'Fleet Vehicle'} ({targetVeh?.registrationNumber})
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Dates: <strong className="text-gray-800">{formatDisplayDate(block.startDate)}</strong> to <strong className="text-gray-800">{formatDisplayDate(block.endDate)}</strong>
                      </p>
                      <p className="text-[10px] text-gray-400 capitalize">
                        Reason: {block.reason.replace('_', ' ')} · {block.notes}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteBlockedDate(block.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                    title="Remove Blackout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Hub Locations Management */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Active Operational Hubs</h3>
            <p className="text-xs text-gray-500">Fleet handover centers across metro clusters</p>
          </div>
          <button
            onClick={() => alert('New Hub Location onboarding modal.')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-xl flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hub City</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hubs.map((hub) => (
            <div key={hub.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{hub.name}</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {hub.vehiclesAvailable} Fleet Units
                </span>
              </div>
              <p className="text-gray-500 text-[11px] line-clamp-2">{hub.address}</p>
              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 space-y-1">
                <p>Hours: {hub.operatingHours}</p>
                <p>Phone: {hub.contactNumber}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
