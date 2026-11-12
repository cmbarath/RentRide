'use client';

import React, { useEffect, useState } from 'react';
import {
  Building,
  Shield,
  Phone,
  Check,
  Save,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [companyName, setCompanyName] = useState('RentRide Mobility Private Limited');
  const [gstin, setGstin] = useState('33AABCR8721K1ZM');
  const [supportPhone, setSupportPhone] = useState('+91 800-RENTRIDE');
  const [supportEmail, setSupportEmail] = useState('support@rentride.in');
  const [emergencyPhone, setEmergencyPhone] = useState('1800-209-9090');
  const [speedLimit, setSpeedLimit] = useState(120);
  const [minDriverAge, setMinDriverAge] = useState(21);
  const [fuelPolicy, setFuelPolicy] = useState<'same_to_same' | 'full_to_full'>('same_to_same');
  const [cancellationGraceHours, setCancellationGraceHours] = useState(6);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success && data.settings) {
          const s = data.settings;
          if (s.companyName) setCompanyName(s.companyName);
          if (s.gstin) setGstin(s.gstin);
          if (s.supportPhone) setSupportPhone(s.supportPhone);
          if (s.supportEmail) setSupportEmail(s.supportEmail);
          if (s.emergencyPhone) setEmergencyPhone(s.emergencyPhone);
          if (s.speedLimit !== undefined) setSpeedLimit(Number(s.speedLimit));
          if (s.minDriverAge !== undefined) setMinDriverAge(Number(s.minDriverAge));
          if (s.fuelPolicy === 'same_to_same' || s.fuelPolicy === 'full_to_full') setFuelPolicy(s.fuelPolicy);
          if (s.cancellationGraceHours !== undefined) setCancellationGraceHours(Number(s.cancellationGraceHours));
        }
      })
      .catch(() => {
        if (!cancelled) setFeedback({ type: 'error', message: 'Could not load settings from server.' });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (companyName.trim().length < 2) {
      setFeedback({ type: 'error', message: 'Company registered name must be at least 2 characters.' });
      return;
    }
    if (gstin.trim().length < 10) {
      setFeedback({ type: 'error', message: 'Valid Tamil Nadu GSTIN (minimum 10 characters) is required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())) {
      setFeedback({ type: 'error', message: 'Please provide a valid support email address.' });
      return;
    }
    if (!Number.isFinite(Number(speedLimit)) || Number(speedLimit) < 40 || Number(speedLimit) > 200) {
      setFeedback({ type: 'error', message: 'Speed governor limit must be between 40 and 200 km/h.' });
      return;
    }
    if (!Number.isFinite(Number(minDriverAge)) || Number(minDriverAge) < 18 || Number(minDriverAge) > 30) {
      setFeedback({ type: 'error', message: 'Minimum driver age must be between 18 and 30 years.' });
      return;
    }
    if (
      !Number.isFinite(Number(cancellationGraceHours)) ||
      Number(cancellationGraceHours) < 1 ||
      Number(cancellationGraceHours) > 72
    ) {
      setFeedback({ type: 'error', message: 'Free cancellation grace period must be between 1 and 72 hours.' });
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          gstin: gstin.trim(),
          supportPhone: supportPhone.trim(),
          supportEmail: supportEmail.trim(),
          emergencyPhone: emergencyPhone.trim(),
          speedLimit: Number(speedLimit),
          minDriverAge: Number(minDriverAge),
          fuelPolicy,
          cancellationGraceHours: Number(cancellationGraceHours),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', message: data.error || 'Failed to save platform settings.' });
      } else {
        setFeedback({ type: 'success', message: 'Platform settings saved to Supabase database.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error while saving platform settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Fleet Operations & Platform Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage Tamil Nadu corporate entity details, speed governor compliance, and fleet operational policies.
          </p>
        </div>

        {isLoading && (
          <div className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading settings...</span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
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

      <form onSubmit={handleSave} noValidate className="space-y-6">
        <fieldset disabled={isLoading} className="space-y-6 disabled:opacity-75">
        {/* 1. Legal & Corporate Identity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <Building className="w-5 h-5 text-gray-700" />
            <h2 className="font-bold text-sm text-gray-900">Tamil Nadu Entity & Legal Registration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Company Registered Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">GSTIN Registration (Tamil Nadu)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. Emergency & Customer Helpline */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-gray-900">24/7 Roadside Assistance & Helpline</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Toll-Free Customer Support</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Emergency Breakdown Hotline</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Support Email Desk</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* 3. Speed Limit & Driving Compliance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <Shield className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-sm text-gray-900">Tamil Nadu Motor Vehicle & Cancellation Compliance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Speed Governor Limit (km/h)
              </label>
              <input
                type="number"
                min={40}
                max={200}
                value={speedLimit}
                onChange={(e) => setSpeedLimit(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-gray-400 mt-1">State transport limit (40–200)</p>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Minimum Self-Drive Age
              </label>
              <input
                type="number"
                min={18}
                max={30}
                value={minDriverAge}
                onChange={(e) => setMinDriverAge(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-gray-400 mt-1">Minimum years holding DL</p>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Free Cancel Grace (hrs)</label>
              <input
                type="number"
                min={1}
                max={72}
                value={cancellationGraceHours}
                onChange={(e) => setCancellationGraceHours(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
              />
              <p className="text-[10px] text-gray-400 mt-1">Hours before scheduled pickup</p>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Fuel Handover Policy</label>
              <select
                value={fuelPolicy}
                onChange={(e) => setFuelPolicy(e.target.value as 'same_to_same' | 'full_to_full')}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
              >
                <option value="same_to_same">Same-to-Same (Return at pickup level)</option>
                <option value="full_to_full">Full-to-Full</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Checked at pickup & return</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 bg-[#111827] hover:bg-black disabled:opacity-60 text-[#C7F36B] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Settings...' : 'Save Platform Settings'}</span>
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
};
