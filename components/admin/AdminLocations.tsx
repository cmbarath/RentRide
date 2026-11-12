'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { HubLocation } from '@/types';
import {
  MapPin,
  Plus,
  Search,
  Clock,
  Phone,
  X,
  Edit2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TN_CITIES } from '@/lib/tn-locations';

export const AdminLocations: React.FC = () => {
  const { hubs, vehicles, refreshLocations } = useApp();

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<HubLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hub Form Fields
  const [formCity, setFormCity] = useState('chennai');
  const [formAreaName, setFormAreaName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formPincode, setFormPincode] = useState('600001');
  const [formContact, setFormContact] = useState('+91 98400 98920');
  const [formHours, setFormHours] = useState('06:00 AM - 11:30 PM');

  const openAddModal = () => {
    setEditingHub(null);
    setModalError(null);
    setFormCity('chennai');
    setFormAreaName('');
    setFormDisplayName('');
    setFormAddress('');
    setFormLandmark('');
    setFormPincode('600001');
    setFormContact('+91 98400 98920');
    setFormHours('06:00 AM - 11:30 PM');
    setIsModalOpen(true);
  };

  const openEditModal = (hub: HubLocation) => {
    setEditingHub(hub);
    setModalError(null);
    setFormCity(hub.cityId || TN_CITIES.find((c) => c.name.toLowerCase() === hub.city.toLowerCase())?.id || 'chennai');
    setFormAreaName(hub.areaName || hub.name.replace(/ Hub$/i, ''));
    setFormDisplayName(hub.name);
    setFormAddress(hub.address);
    setFormLandmark(hub.landmark || '');
    setFormPincode(hub.pincode || '600001');
    setFormContact(hub.contactNumber || '+91 98400 98920');
    setFormHours(hub.operatingHours || '06:00 AM - 11:30 PM');
    setIsModalOpen(true);
  };

  const toggleHubActive = async (hub: HubLocation) => {
    setTogglingId(hub.id);
    setFeedback(null);
    try {
      const nextActive = !(hub.isActive ?? true);
      const res = await fetch(`/api/locations/${encodeURIComponent(hub.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update hub status.' });
      } else {
        await refreshLocations();
        setFeedback({
          type: 'success',
          message: `${hub.name} marked as ${nextActive ? 'Active' : 'Disabled'}.`,
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while updating hub status.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setFeedback(null);

    if (!formAreaName.trim() || !formAddress.trim()) {
      setModalError('Area name and physical street address are required.');
      return;
    }

    if (!/^\d{6}$/.test(formPincode.trim())) {
      setModalError('Please enter a valid 6-digit Tamil Nadu PIN code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cityName = TN_CITIES.find((c) => c.id === formCity)?.name || formCity;
      const resolvedDisplayName = formDisplayName.trim() || `${formAreaName.trim()} Hub`;

      if (editingHub) {
        const res = await fetch(`/api/locations/${encodeURIComponent(editingHub.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: resolvedDisplayName,
            address: formAddress.trim(),
            landmark: formLandmark.trim() || undefined,
            operatingHours: formHours.trim(),
            contactNumber: formContact.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setModalError(data.error || 'Failed to update pickup hub.');
          setIsSubmitting(false);
          return;
        }
        setFeedback({ type: 'success', message: `${resolvedDisplayName} updated in Supabase.` });
      } else {
        const res = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityId: formCity,
            cityName,
            areaName: formAreaName.trim(),
            displayName: resolvedDisplayName,
            address: formAddress.trim(),
            landmark: formLandmark.trim() || undefined,
            pincode: formPincode.trim(),
            operatingHours: formHours.trim(),
            contactNumber: formContact.trim(),
            isActive: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setModalError(data.error || 'Failed to create pickup hub.');
          setIsSubmitting(false);
          return;
        }
        setFeedback({ type: 'success', message: `${resolvedDisplayName} (${cityName}) created in Supabase.` });
      }

      await refreshLocations();
      setIsModalOpen(false);
    } catch {
      setModalError('Network error while saving hub location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehiclesPerHub = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vehicles) {
      if (v.pickupLocationId) {
        counts[v.pickupLocationId] = (counts[v.pickupLocationId] || 0) + 1;
      }
    }
    return counts;
  }, [vehicles]);

  const filteredHubs = hubs.filter((h) => {
    if (selectedCity !== 'all' && h.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeHubsCount = hubs.filter((h) => h.isActive !== false).length;
  const uniqueCitiesCount = new Set(hubs.map((h) => h.city.toLowerCase())).size;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Tamil Nadu Hubs & Location Networks
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure pickup hubs, activate rental branches, and expand into new Tamil Nadu districts.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-[#111827] hover:bg-black text-[#C7F36B] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New TN Hub</span>
        </button>
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
          <div className="text-xs text-gray-500 font-semibold mb-1">Total Rental Hubs</div>
          <div className="text-2xl font-black text-gray-900">{hubs.length}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Across urban & transit corridors</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Active Branches</div>
          <div className="text-2xl font-black text-emerald-600">{activeHubsCount}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Ready for instant key handovers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Districts Covered</div>
          <div className="text-2xl font-black text-blue-600">{uniqueCitiesCount}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Active across Tamil Nadu network</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by area, landmark or city..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
            />
          </div>

          {/* City selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedCity('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedCity === 'all'
                  ? 'bg-[#111827] text-[#C7F36B] shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Cities
            </button>
            {TN_CITIES.slice(0, 7).map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelectedCity(c.name)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedCity.toLowerCase() === c.name.toLowerCase()
                    ? 'bg-[#111827] text-[#C7F36B] shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Hubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHubs.map((hub) => {
            const isActive = hub.isActive !== false;
            const unitCount =
              vehiclesPerHub[hub.id] ??
              vehicles.filter((v) => v.location.toLowerCase().includes(hub.name.toLowerCase())).length;

            return (
              <div
                key={hub.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                    : 'bg-gray-50/80 border-dashed border-gray-200 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#111827]" />
                      <h3 className="font-bold text-sm text-gray-900">{hub.name}</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {hub.city}, Tamil Nadu {hub.pincode ? `• ${hub.pincode}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(hub)}
                      className="p-1 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100"
                      title="Edit Hub"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={togglingId === hub.id}
                      onClick={() => toggleHubActive(hub)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {togglingId === hub.id ? '...' : isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 mb-3 min-h-[32px]">{hub.address}</p>

                <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{hub.operatingHours}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{hub.contactNumber}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Vehicles assigned:</span>
                  <span className="font-bold text-gray-900">{unitCount} units</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Hub Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-[#111827] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingHub ? `Edit ${editingHub.name}` : 'Add New Tamil Nadu Hub'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHub} className="p-6 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {!editingHub && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Select Tamil Nadu City</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    {TN_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region} Region)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Area / Neighbourhood</label>
                  <input
                    type="text"
                    value={formAreaName}
                    disabled={!!editingHub}
                    onChange={(e) => {
                      setFormAreaName(e.target.value);
                      if (!editingHub) setFormDisplayName(e.target.value ? `${e.target.value} Hub` : '');
                    }}
                    placeholder="e.g. Porur"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Hub Display Name</label>
                  <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="e.g. Porur Junction Hub"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Full Physical Street Address</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Plot 14, Mount Poonamallee High Rd, Porur, Chennai"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">PIN Code (6 digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    disabled={!!editingHub}
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="600116"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={formLandmark}
                    onChange={(e) => setFormLandmark(e.target.value)}
                    placeholder="Near Metro Station"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="+91 98400 98920"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    placeholder="06:00 AM - 11:30 PM"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#111827] text-[#C7F36B] font-bold rounded-xl hover:bg-black disabled:opacity-60 shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Saving...' : editingHub ? 'Save Changes' : 'Create Hub'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
