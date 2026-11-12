import React from 'react';
import { SearchPanel } from './SearchPanel';
import { ShieldCheck, Sparkles, Clock, CheckCircle } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-[#111827] text-white overflow-hidden pb-16 pt-8 lg:pt-12">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111827] via-[#111827]/95 to-[#0D131F] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top headline block */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/80 border border-gray-700/80 text-xs font-semibold text-[#C7F36B] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Car & Bike Fleet Across 4 Major Metros</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight text-balance">
            Find Your <span className="text-[#C7F36B]">Perfect Ride.</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Experience frictionless self-drive cars and premium bikes with instant online booking, transparent pricing, verified fleet maintenance, and seamless doorstep delivery.
          </p>
        </div>

        {/* Hero Image Showcase */}
        <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl mb-8 group max-h-[440px]">
          <img
            src="/src/assets/images/hero_automotive_duo_1793632402154.jpg"
            alt="RentRide Premium Fleet - Luxury SUV and Modern Motorcycle"
            className="w-full h-[320px] sm:h-[400px] lg:h-[440px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-80" />
          
          {/* Overlay fleet badge */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="bg-[#111827]/85 backdrop-blur-md border border-gray-700/80 rounded-xl p-3 max-w-md">
              <p className="font-bold text-white text-sm">Self-Drive Freedom</p>
              <p className="text-gray-300 text-xs">Unlimited km options, comprehensive insurance & sanitised vehicle guarantee.</p>
            </div>

            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 text-[#C7F36B] font-semibold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>15-Min KYC Approval</span>
              </div>
              <span className="text-gray-500">·</span>
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Deposit Options</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Panel Embedded */}
        <div className="relative -mt-6 lg:-mt-12 z-20 max-w-5xl mx-auto">
          <SearchPanel />
        </div>

        {/* Trust metrics bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-800/80 text-center">
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-[#C7F36B] tabular-nums">1,250+</div>
            <div className="text-xs text-gray-400 mt-1">Verified Fleet Vehicles</div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white tabular-nums">48,000+</div>
            <div className="text-xs text-gray-400 mt-1">Trips Completed</div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white tabular-nums">4.9 / 5.0</div>
            <div className="text-xs text-gray-400 mt-1">Average Customer Rating</div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-[#C7F36B] tabular-nums">24 / 7</div>
            <div className="text-xs text-gray-400 mt-1">On-Road Assistance</div>
          </div>
        </div>

      </div>
    </section>
  );
};
