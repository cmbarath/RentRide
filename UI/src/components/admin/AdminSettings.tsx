import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Building,
  Shield,
  Bell,
  Phone,
  Mail,
  Check,
  Save,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [companyName, setCompanyName] = useState('RentRide Mobility Private Limited');
  const [gstin, setGstin] = useState('29AABCU9603R1ZM');
  const [supportPhone, setSupportPhone] = useState('+91 800-RENTRIDE');
  const [supportEmail, setSupportEmail] = useState('concierge@rentride.in');
  const [emergencyPhone, setEmergencyPhone] = useState('1800-209-9090');
  const [speedLimit, setSpeedLimit] = useState(120);
  const [minDriverAge, setMinDriverAge] = useState(21);
  const [fuelPolicy, setFuelPolicy] = useState('same_to_same');

  // WhatsApp & SMS notifications toggle
  const [whatsappBookingAlerts, setWhatsappBookingAlerts] = useState(true);
  const [whatsappKycApprovals, setWhatsappKycApprovals] = useState(true);
  const [whatsappReturnReminders, setWhatsappReturnReminders] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Business Settings & Policy Controls
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage entity details, speed governor compliance, WhatsApp notifications, and emergency support channels.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings and rental policies saved successfully across all hubs!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Business Legal Info */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-sm text-gray-900">Registered Corporate Entity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">GSTIN (Commercial SAC: 996601)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Customer Support Helpline</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Official Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. Rental & Safety Policies */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Shield className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-sm text-gray-900">Rental & Safety Standards</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Maximum Speed Limit (km/h)</label>
              <input
                type="number"
                value={speedLimit}
                onChange={(e) => setSpeedLimit(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold font-mono"
                required
              />
              <span className="text-[10px] text-gray-400 mt-1 block">RTO expressway telemetry threshold</span>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Minimum Driver Age</label>
              <input
                type="number"
                value={minDriverAge}
                onChange={(e) => setMinDriverAge(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold font-mono"
                required
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Valid licence held for &ge; 1 year</span>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Fuel Handover Policy</label>
              <select
                value={fuelPolicy}
                onChange={(e) => setFuelPolicy(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
              >
                <option value="same_to_same">Same-to-Same Fuel Level</option>
                <option value="full_tank">Full-Tank Delivery</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. WhatsApp & SMS Automations */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-gray-900">WhatsApp Notification Automations</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <p className="font-bold text-gray-900">Instant Booking Confirmation & OTP Pass</p>
                <p className="text-[11px] text-gray-400">Dispatches QR code and vehicle handover PIN to customer's WhatsApp</p>
              </div>
              <input
                type="checkbox"
                checked={whatsappBookingAlerts}
                onChange={(e) => setWhatsappBookingAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#111827]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <p className="font-bold text-gray-900">KYC Approval & Payment Link Dispatch</p>
                <p className="text-[11px] text-gray-400">Notifies customer when their licence is verified by fleet manager</p>
              </div>
              <input
                type="checkbox"
                checked={whatsappKycApprovals}
                onChange={(e) => setWhatsappKycApprovals(e.target.checked)}
                className="w-4 h-4 rounded text-[#111827]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <p className="font-bold text-gray-900">Trip Return & Security Deposit Refund Alert</p>
                <p className="text-[11px] text-gray-400">Sends reminder 2 hours before trip expiry and bank refund UTR reference</p>
              </div>
              <input
                type="checkbox"
                checked={whatsappReturnReminders}
                onChange={(e) => setWhatsappReturnReminders(e.target.checked)}
                className="w-4 h-4 rounded text-[#111827]"
              />
            </label>
          </div>
        </div>

        {/* 4. Emergency SOS Dispatch */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Phone className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-sm text-gray-900">24/7 Roadside SOS Hotlines</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Pan-India Breakdown Hotline</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Fleet Insurance Policy Number</label>
              <input
                type="text"
                defaultValue="HDFC-ERGO-COMM-891024-V"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Platform Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
};
