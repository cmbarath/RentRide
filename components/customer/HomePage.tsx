'use client';

import React, { useState } from 'react';
import { HeroSection } from './HeroSection';
import { VehicleCard } from './VehicleCard';
import { useApp } from '@/context/AppContext';
import {
  Car,
  Bike,
  Shield,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Star,
  Zap,
  Fuel,
  MessageSquare,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { vehicles, isVehiclesLoading, hubs, publicReviews, triggerSearch } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Featured live Supabase vehicles
  const featuredCars = vehicles.filter((v) => v.type === 'car').slice(0, 4);
  const popularBikes = vehicles.filter((v) => v.type === 'bike').slice(0, 4);

  const categories = [
    {
      name: 'Family & Commuter Bikes',
      type: 'bike' as const,
      dbCategory: 'Family & Commuter',
      desc: 'Splendor, Shine, Unicorn & Raider. High mileage for daily commuting.',
      icon: Bike,
    },
    {
      name: 'City & Street Sports',
      type: 'bike' as const,
      dbCategory: 'City & Street',
      desc: 'Apache RTR, MT-15, Pulsar N160 & Duke 200. Sharp street handling.',
      icon: Zap,
    },
    {
      name: 'Touring & Highway Bikes',
      type: 'bike' as const,
      dbCategory: 'Touring & Highway',
      desc: 'Hunter 350, Classic 350, Himalayan 450 & CB350. Built for long trips.',
      icon: Sparkles,
    },
    {
      name: 'City Scooters & EV',
      type: 'bike' as const,
      dbCategory: 'Scooter',
      desc: 'Activa 6G, Jupiter 125, Access 125 & Ather 450X smart EV.',
      icon: Fuel,
    },
    {
      name: 'Economical Hatchbacks',
      type: 'car' as const,
      dbCategory: 'Hatchback',
      desc: 'Swift, Baleno, i20, Altroz & Tiago. Compact & nimble for city traffic.',
      icon: Car,
    },
    {
      name: 'Executive Sedans',
      type: 'car' as const,
      dbCategory: 'Sedan',
      desc: 'Dzire, City, Verna, Virtus & Slavia. Unmatched highway comfort.',
      icon: Sparkles,
    },
    {
      name: 'SUVs & Compact SUVs',
      type: 'car' as const,
      dbCategory: 'SUV',
      desc: 'Creta, Seltos, Brezza, Nexon & Scorpio-N. High ground clearance.',
      icon: Shield,
    },
    {
      name: '7-Seater Family MPVs',
      type: 'car' as const,
      dbCategory: 'Family MPV',
      desc: 'Ertiga & Innova Crysta. Spacious 7-passenger capacity for tours.',
      icon: Car,
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Choose Vehicle & Dates',
      desc: `Select from ${vehicles.length || 56} verified cars and bikes across ${hubs.length || 28} active Tamil Nadu pickup hubs.`,
    },
    {
      num: '02',
      title: '15-Minute Digital KYC',
      desc: 'Upload front and back photos of your original Driving Licence inside your dashboard for instant verification.',
    },
    {
      num: '03',
      title: 'Counter Settlement & Pickup Pass',
      desc: 'Submit your booking without advance payment. Pay via Cash or UPI at the hub counter and unlock your 4-digit pickup OTP.',
    },
    {
      num: '04',
      title: 'Drive & Return',
      desc: 'Enjoy unlimited highway freedom across Tamil Nadu. Return to the hub for vehicle inspection and fast deposit settlement.',
    },
  ];

  const faqs = [
    {
      q: 'What documents are required to rent a vehicle in Tamil Nadu?',
      a: 'You need an original Indian Driving Licence (held for at least 1 year for self-drive cars, or valid MCWG licence for geared motorcycles), an Aadhaar card or Passport for digital KYC verification, and you must be at least 21 years old.',
    },
    {
      q: 'How does the driving licence approval process work?',
      a: 'When you submit your booking and KYC documents, our fleet verification desk reviews your licence credentials. Once approved, your booking receives a verified status and 4-digit pickup passcode for counter handover.',
    },
    {
      q: 'How do payments and security deposits work?',
      a: 'No advance online payment is required during booking. Rental charges and refundable security deposits are settled directly in-person at the hub counter via Cash or UPI, and refunded post vehicle inspection.',
    },
    {
      q: 'What is RentRide’s cancellation policy?',
      a: 'Full cancellation flexibility prior to vehicle handover directly from your Customer Dashboard with immediate slot release.',
    },
    {
      q: 'Can I pick up in Chennai and ride across Tamil Nadu?',
      a: 'Yes! Vehicles operate across all 28 Tamil Nadu regional hubs including Chennai, Coimbatore, Madurai, Trichy, Salem, Ooty, and Kodaikanal.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 1. Hero Section with Integrated Search Panel */}
      <HeroSection />

      {/* 2. Featured Self-Drive Cars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              <span>Verified Fleet</span>
              <span aria-hidden="true">·</span>
              <span>Tamil Nadu Self-Drive Cars</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Featured Self-Drive Cars
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sanitized, GPS-enabled hatchbacks, executive sedans, compact SUVs, and 7-seater MPVs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => triggerSearch({ type: 'car', category: 'all' })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111827] hover:text-black bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
          >
            <span>View All Cars ({vehicles.filter((v) => v.type === 'car').length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isVehiclesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-80 animate-pulse p-4 space-y-3">
                <div className="h-40 bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredCars.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-xs text-gray-500">
            No active cars available in fleet inventory at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map((car) => (
              <VehicleCard key={car.id} vehicle={car} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Popular Bikes Section */}
      <section className="bg-white py-16 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                <span>Two-Wheeler Freedom</span>
                <span aria-hidden="true">·</span>
                <span>Bikes &amp; EV Scooters</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Popular Bikes &amp; Scooters
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                From economical commuters and street fighters to Royal Enfield highway cruisers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => triggerSearch({ type: 'bike', category: 'all' })}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111827] hover:text-black bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>View All Bikes ({vehicles.filter((v) => v.type === 'bike').length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {isVehiclesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 rounded-2xl border border-gray-200 h-80 animate-pulse p-4 space-y-3">
                  <div className="h-40 bg-gray-200 rounded-xl" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : popularBikes.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-10 text-center text-xs text-gray-500">
              No active bikes available in fleet inventory at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularBikes.map((bike) => (
                <VehicleCard key={bike.id} vehicle={bike} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Complete Vehicle Categories Grid */}
      <section id="fleet" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Explore by Vehicle Category
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Tailored categories for family road trips, city commuting, Ghat road touring, and executive mobility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const liveCount = vehicles.filter(
              (v) => v.type === cat.type && v.category === cat.dbCategory
            ).length;
            return (
              <div
                key={idx}
                onClick={() => triggerSearch({ type: cat.type, category: cat.dbCategory })}
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-gray-900 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#111827] text-gray-800 group-hover:text-[#C7F36B] flex items-center justify-center transition-colors mb-3.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-black">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cat.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span className="text-gray-400 font-medium">{liveCount} Models</span>
                  <span className="text-[#111827] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="bg-[#111827] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C7F36B] mb-2 block">
              Seamless 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How RentRide Works
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              From online booking request to counter handover in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st, i) => (
              <div
                key={i}
                className="relative bg-gray-800/60 p-6 rounded-2xl border border-gray-700/60 flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-black text-[#C7F36B] mb-3">{st.num}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{st.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Live Approved Customer Reviews from Supabase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1 block">
            Verified Database Reviews
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Trusted by Drivers Across Tamil Nadu
          </h2>
        </div>

        {publicReviews.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-2">
            <MessageSquare className="w-7 h-7 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-900">Verified Trip Reviews</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Verified reviews submitted by customers after completing RentRide trips appear here once published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicReviews.slice(0, 3).map((r) => {
              const veh = vehicles.find((v) => v.id === r.vehicle_id);
              return (
                <div
                  key={r.id}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(Math.min(5, Math.max(1, r.rating || 5)))].map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic mb-4">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-gray-900">{r.user_name}</div>
                      <div className="text-[11px] text-gray-400">Verified Rental</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 truncate max-w-[140px]">
                      {veh?.name || r.vehicle_id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. FAQ Accordion Section */}
      <section id="faq" className="bg-white py-16 border-t border-gray-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">
              Clear Policies &amp; Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-sm text-gray-900 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span>{f.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-black' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
