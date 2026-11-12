import React from 'react';
import { useApp } from '../../context/AppContext';
import { Car, Phone, Mail, MapPin, Shield, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCustomerScreen, triggerSearch, setMode, setAdminScreen } = useApp();

  return (
    <footer className="bg-[#0D131F] text-gray-400 text-sm border-t border-gray-800">
      {/* Upper Features Bar */}
      <div className="border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">100% Verified Fleet</p>
              <p className="text-xs text-gray-400">Maintained and sanitized by certified technicians</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Zero Hidden Charges</p>
              <p className="text-xs text-gray-400">All prices include insurance and GST transparency</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Doorstep Delivery</p>
              <p className="text-xs text-gray-400">Delivered directly to your residence, airport or hotel</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-800/90 text-[#C7F36B] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">24/7 Roadside Assistance</p>
              <p className="text-xs text-gray-400">Emergency support & towing anywhere in India</p>
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
              "Your Ride. Your Journey. Your Freedom."
            </p>
            <p className="text-xs leading-relaxed text-gray-400 max-w-sm">
              RentRide is India’s premium self-drive mobility platform. From luxury executive sedans and rugged 4x4 off-roaders to punchy urban scramblers and smart electric scooters, experience frictionless travel.
            </p>
            <div className="pt-2 text-xs text-gray-400 space-y-1">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>+91 800-RENTRIDE (Toll-Free 24/7)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C7F36B]" />
                <span>concierge@rentride.in</span>
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
                  className="hover:text-white transition-colors"
                >
                  Self-Drive Cars
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'bike' })}
                  className="hover:text-white transition-colors"
                >
                  Motorcycles & Scooters
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'car' })}
                  className="hover:text-white transition-colors"
                >
                  SUVs & 4x4 Off-Roaders
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'car' })}
                  className="hover:text-white transition-colors"
                >
                  Luxury Executive Sedans
                </button>
              </li>
              <li>
                <button
                  onClick={() => triggerSearch({ type: 'all' })}
                  className="hover:text-white transition-colors"
                >
                  Electric Vehicles (EVs)
                </button>
              </li>
            </ul>
          </div>

          {/* City Hubs */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Hub Locations</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Indiranagar, Bengaluru</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Koramangala, Bengaluru</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Bandra West, Mumbai</span>
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B] shrink-0 mt-0.5" />
                <span>Connaught Place, New Delhi</span>
              </li>
              <li className="text-[11px] text-gray-400 pt-1">
                + Airport terminals pickup support
              </li>
            </ul>
          </div>

          {/* Policies & Admin Shortcut */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company & Legal</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Rental & Fuel Policy</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Cancellation & Security Deposit</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Licence & Age Requirements</a></li>
              <li className="pt-2">
                <button
                  onClick={() => {
                    setMode('admin');
                    setAdminScreen('overview');
                  }}
                  className="text-xs text-[#C7F36B] hover:underline font-semibold flex items-center gap-1"
                >
                  Fleet Manager Sign In →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} RentRide Mobility Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-300 cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
