'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, LogOut, ShieldCheck, Car, Key, Menu, X, ArrowRight, MapPin, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    customerScreen,
    setCustomerScreen,
    currentUser,
    isAuthLoading,
    setIsAuthModalOpen,
    setAuthModalMode,
    signOutWithSupabase,
    mode,
    setMode,
    setAdminScreen,
    searchCriteria,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  type NavItem = { label: string; screen: 'home' | 'explore' } | { label: string; href: string };

  const navLinks: NavItem[] = [
    { label: 'Home', screen: 'home' },
    { label: 'Explore Vehicles', screen: 'explore' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Fleet & Pricing', href: '#fleet' },
    { label: 'Tamil Nadu Hubs', href: '#hubs' },
    { label: 'Support', href: '#faq' },
  ];

  const handleAdminPortalClick = () => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'fleet_manager') {
      setMode('admin');
      setAdminScreen('overview');
    } else {
      setAuthModalMode('admin-login');
      setIsAuthModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#111827] text-white border-b border-gray-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Location Pill */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => {
              setCustomerScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C7F36B] flex items-center justify-center text-[#111827] shadow-sm group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block leading-none">
                Rent<span className="text-[#C7F36B]">Ride</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase text-gray-400 font-medium">
                Tamil Nadu Mobility
              </span>
            </div>
          </button>

          {/* Regional Indicator Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/80 border border-gray-700/80 text-[11px] text-gray-300">
            <MapPin className="w-3 h-3 text-[#C7F36B]" />
            <span className="capitalize font-semibold text-white">{searchCriteria.city || 'Chennai'}</span>
            <span className="text-gray-500">· 16 TN Cities</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-300">
          {navLinks.map((link) =>
            'screen' in link ? (
              <button
                key={link.label}
                onClick={() => {
                  setCustomerScreen(link.screen);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`whitespace-nowrap transition-colors py-1 ${
                  customerScreen === link.screen
                    ? 'text-[#C7F36B] font-semibold border-b-2 border-[#C7F36B]'
                    : 'hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => {
                  if (customerScreen !== 'home') {
                    setCustomerScreen('home');
                  }
                }}
                className="whitespace-nowrap hover:text-white transition-colors py-1"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Zone 3: Actions & Account + Admin Portal Switch */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Admin Portal Switch Button */}
          <button
            onClick={handleAdminPortalClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            title="Access Fleet Management Console"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C7F36B]" />
            <span>Admin Portal</span>
          </button>

          {isAuthLoading ? (
            <div className="h-9 w-28 rounded-full bg-gray-800/80 border border-gray-700 animate-pulse" />
          ) : currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-left transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#C7F36B] text-[#111827] flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-gray-400 capitalize">
                    {currentUser.licenceStatus === 'verified' ? 'Verified Renter' : 'Licence Pending'}
                  </div>
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-gray-900 shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold truncate text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                    {currentUser.phone && <p className="text-[10px] text-gray-400 truncate">{currentUser.phone}</p>}
                  </div>

                  <button
                    onClick={() => {
                      setCustomerScreen('dashboard');
                      setIsProfileDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>My Account &amp; Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setCustomerScreen('dashboard');
                      setIsProfileDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Car className="w-4 h-4 text-gray-400" />
                    <span>My Bookings & Trips</span>
                  </button>

                  <button
                    onClick={() => {
                      setCustomerScreen('dashboard');
                      setIsProfileDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-gray-400" />
                    <span>Driving Licence & KYC</span>
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={() => {
                      signOutWithSupabase();
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-gray-200 hover:text-white transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                }}
                className="hidden sm:flex px-3.5 py-1.5 text-xs font-bold text-[#111827] bg-[#C7F36B] hover:bg-[#bbf055] rounded-lg transition-all shadow-sm items-center gap-1 cursor-pointer"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile & Tablet hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 text-gray-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-gray-900 border-b border-gray-800 px-4 pt-2 pb-5 space-y-2">
          {currentUser && (
            <div className="p-3 mb-2 rounded-xl bg-gray-800/80 border border-gray-700">
              <p className="text-xs text-gray-400">Signed in as</p>
              <p className="text-sm font-bold text-white">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
            </div>
          )}
          {navLinks.map((link) =>
            'screen' in link ? (
              <button
                key={link.label}
                onClick={() => {
                  setCustomerScreen(link.screen);
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`block w-full text-left py-2 px-3 rounded-lg text-sm font-medium ${
                  customerScreen === link.screen
                    ? 'bg-gray-800 text-[#C7F36B]'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => {
                  if (customerScreen !== 'home') setCustomerScreen('home');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 px-3 rounded-lg text-sm text-gray-300 hover:bg-gray-800 font-medium"
              >
                {link.label}
              </a>
            )
          )}
          {currentUser && (
            <button
              onClick={() => {
                setCustomerScreen('dashboard');
                setIsMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm text-gray-300 hover:bg-gray-800 font-medium cursor-pointer"
            >
              My Bookings & Trips
            </button>
          )}
          <div className="pt-2 border-t border-gray-800 flex flex-col gap-2">
            {currentUser ? (
              <button
                onClick={() => {
                  signOutWithSupabase();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 text-red-300 border border-red-800/50 rounded-lg text-sm font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out ({currentUser.name.split(' ')[0]})</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex-1 py-2 text-center rounded-lg bg-gray-800 text-white text-sm font-medium cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthModalMode('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex-1 py-2 text-center rounded-lg bg-[#C7F36B] text-[#111827] text-sm font-bold cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleAdminPortalClick();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-800 text-gray-200 rounded-lg text-sm font-medium cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#C7F36B]" />
              <span>Fleet Operations Console</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
