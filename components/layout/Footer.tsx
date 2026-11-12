'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Car, Phone, Mail, MapPin, Shield, CheckCircle2, Clock } from 'lucide-react';
import { TN_CITIES } from '@/lib/tn-locations';

export const Footer: React.FC = () => {
  const {
    setCustomerScreen,
    triggerSearch,
    setMode,
    setAdminScreen,
    currentUser,
    setAuthModalMode,
    setIsAuthModalOpen,
  } = useApp();

  return (
    <footer className="bg-[#0D131F] text-gray-400 text-sm border-t border-gray-800">
      {/* Upper Features Bar */}
      <div className="border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">100% Verified Fleet</p>
              <p className="text-xs text-gray-400">Sanitized, RTO-compliant & dealer serviced</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Zero Hidden Charges</p>
              <p className="text-xs text-gray-400">Comprehensive insurance & transparent GST</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Doorstep Delivery</p>
              <p className="text-xs text-gray-400">Hub pickup or home delivery across Tamil Nadu</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">24/7 Roadside Assist</p>
              <p className="text-xs text-gray-400">Emergency support & towing across highways</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#C7F36B] flex items-center justify-center text-[#111827]">
                <Car className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-extrabold text-white">
                Rent<span className="text-[#C7F36B]">Ride</span>
              </span>
            </div>
            <p className="text-xs text-[#C7F36B] font-medium tracking-wide">
              &ldquo;Your Ride. Your Journey. Your Freedom.&rdquo;
            </p>
            <p className="text-xs leading-relaxed text-gray-400 max-w-sm">
              RentRide is Tamil Nadu’s premier self-drive car and bike rental platform. From high-mileage commuter bikes and highway cruisers like Royal Enfield to family SUVs, sedans, and luxury executive cars, explore with complete freedom.
            </p>
            <div className="pt-2 text-xs text-gray-400 space-y-1.5">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>+91 800-RENTRIDE (Toll-Free 24/7)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>support@rentride.in</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>Central Hub: Anna Salai, Guindy, Chennai, Tamil Nadu 600032</span>
              </p>
            </div>
          </div>

          {/* Quick Explore */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Explore Fleet</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'car' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Self-Drive Cars
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'bike' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Touring Bikes & Cruisers
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'bike' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Commuters & City Bikes
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'car' })}
                  className="hover:text-white transition-colors text-left"
                >
                  SUVs & Compact Off-Roaders
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'car' })}
                  className="hover:text-white transition-colors text-left"
                >
                  Executive Sedans & EVs
                </button>
              </li>
            </ul>
          </div>

          {/* Tamil Nadu Hub Locations */}
          <div id="hubs">
            <h4 className="text-white font-semibold text-sm mb-4">Tamil Nadu Hubs</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Chennai: T. Nagar, Anna Nagar, Airport & OMR</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Coimbatore: RS Puram & Gandhipuram</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Madurai: KK Nagar & Mattuthavani</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Trichy, Salem, Vellore & Hosur</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Hill Stations: Ooty & Kodaikanal</span>
              </li>
              <li className="text-[11px] text-gray-500 pt-1">
                + Operating in all 16 major Tamil Nadu districts
              </li>
            </ul>
          </div>

          {/* Policies & Admin Shortcut */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company & Policies</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Fuel & Kilometre Policy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Security Deposit Refund
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Licence & Age Requirements
                </a>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => {
                    if (currentUser?.role === 'admin' || currentUser?.role === 'fleet_manager') {
                      setMode('admin');
                      setAdminScreen('overview');
                    } else {
                      setAuthModalMode('admin-login');
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="text-xs text-[#C7F36B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Fleet Admin Console →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} RentRide Mobility Pvt. Ltd. Tamil Nadu, India. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Rental Agreement</span>
            <span className="hover:text-gray-300 cursor-pointer">GSTIN: 33AABCR8721K1ZM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
