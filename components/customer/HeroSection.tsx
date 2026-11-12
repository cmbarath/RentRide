'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { SearchPanel } from './SearchPanel';
import { ShieldCheck, Zap, Sparkles, Award, MapPin } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { vehicles, triggerSearch } = useApp();

  const minBikePrice = vehicles
    .filter((v) => v.type === 'bike')
    .reduce((min, v) => (v.pricePerDay < min ? v.pricePerDay : min), Infinity);
  const minCarPrice = vehicles
    .filter((v) => v.type === 'car')
    .reduce((min, v) => (v.pricePerDay < min ? v.pricePerDay : min), Infinity);

  return (
    <div className="relative">
      {/* Hero Visual Banner */}
      <div className="relative bg-[#0f172a] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#111827] to-[#1e293b] opacity-95" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c7f36b]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Regional Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#C7F36B] text-xs font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>Tamil Nadu&apos;s #1 Car &amp; Bike Rental Network · 16 Cities</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Your Ride. <br />
                Your Journey. <br />
                <span className="text-[#C7F36B]">Your Freedom.</span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
                Experience premium self-drive cars, highway touring motorcycles, and smart EV scooters across Chennai, Coimbatore, Madurai, Ooty, and Kodaikanal. 15-minute digital KYC and instant digital pickup passes.
              </p>

              {/* Key Trust Signals */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#C7F36B] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-white block">Zero Deposit</span>
                    <span className="text-gray-400">On select rides</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-white block">Instant KYC</span>
                    <span className="text-gray-400">15-min approval</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-white block">50+ Models</span>
                    <span className="text-gray-400">Verified Fleet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900 aspect-[4/3]">
                <img
                  src="/images/hero_automotive_duo.jpg"
                  alt="RentRide Automotive Duo Fleet in Tamil Nadu"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-80" />

                {/* Overlaid Pill Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between text-gray-900 shadow-lg">
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      Explore {vehicles.length > 0 ? `${vehicles.length} Live Vehicles` : 'Live Fleet'}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {minBikePrice !== Infinity && minCarPrice !== Infinity
                        ? `From ₹${minBikePrice.toLocaleString('en-IN')}/day (Bikes) · ₹${minCarPrice.toLocaleString('en-IN')}/day (Cars)`
                        : 'Live fleet inventory synced with Supabase'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerSearch({ type: 'all' })}
                    className="px-3.5 py-1.5 bg-[#111827] hover:bg-black text-[#C7F36B] text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Browse Fleet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Search Panel */}
      <SearchPanel />
    </div>
  );
};
