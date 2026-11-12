import React, { useState } from 'react';
import { HeroSection } from './HeroSection';
import { VehicleCard } from './VehicleCard';
import { useApp } from '../../context/AppContext';
import { FAQS } from '../../data/mockData';
import {
  Car,
  Bike,
  Shield,
  Clock,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Star,
  Zap,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { vehicles, setCustomerScreen, triggerSearch } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const featuredCars = vehicles.filter((v) => v.type === 'car').slice(0, 4);
  const popularBikes = vehicles.filter((v) => v.type === 'bike').slice(0, 4);

  const categories = [
    { name: 'SUVs & Compacts', type: 'car' as const, count: '14 Models', icon: Car, desc: 'Spacious 5 & 7 seaters with high ground clearance' },
    { name: 'Scramblers & Cruisers', type: 'bike' as const, count: '10 Models', icon: Bike, desc: 'Classic road thumpers for city & weekend highway runs' },
    { name: 'Luxury Sedans', type: 'car' as const, count: '6 Models', icon: Sparkles, desc: 'Executive comfort with panoramic views & premium sound' },
    { name: 'Naked Street Sports', type: 'bike' as const, count: '8 Models', icon: Zap, desc: 'Aggressive street performance & precision cornering' },
    { name: 'Electric Mobility (EV)', type: 'car' as const, count: '6 Models', icon: Zap, desc: 'Clean, whisper-quiet electric cars & smart scooters' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Select Your Ride',
      desc: 'Browse hundreds of verified cars and bikes. Filter by transmission, fuel, seating, or pickup hub.',
    },
    {
      num: '02',
      title: '15-Min KYC Approval',
      desc: 'Upload front and back photos of your driving licence. Our team verifies your credentials in minutes.',
    },
    {
      num: '03',
      title: 'Digital Pickup Pass',
      desc: 'Pay online securely via UPI or Card. Receive your instant pickup QR code & vehicle handover PIN.',
    },
    {
      num: '04',
      title: 'Drive & Seamless Return',
      desc: 'Enjoy unlimited highway freedom. Return to any hub or schedule doorstep collection with instant deposit refund.',
    },
  ];

  const reviews = [
    {
      name: 'Aditya Mathur',
      role: 'Software Architect, Bengaluru',
      text: 'Rented the Creta Turbo for a 4-day trip to Coorg. The car was spotless, had only 14k km on the odometer, and the pickup took literally 3 minutes at Indiranagar hub. Absolutely flawless experience compared to older rental platforms.',
      rating: 5,
      vehicle: 'Hyundai Creta SX (O)',
      verified: true,
    },
    {
      name: 'Sneha Kulkarni',
      role: 'Product Designer, Mumbai',
      text: 'Took the Hunter 350 for a scenic coastal ride down to Alibaug. Super nimble bike, helmet was fresh and ISI certified, and the security deposit was credited back to my UPI within 4 hours of return. Highly recommended!',
      rating: 5,
      vehicle: 'Royal Enfield Hunter 350',
      verified: true,
    },
    {
      name: 'Karthik Subramanian',
      role: 'Startup Founder, New Delhi',
      text: 'Booked the Mercedes E-Class for an investor delegation visit. The car arrived right at my hotel in pristine condition. The admin approval team was extremely fast and responsive over WhatsApp.',
      rating: 5,
      vehicle: 'Mercedes-Benz E-Class',
      verified: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 1. Hero Section with Search */}
      <HeroSection />

      {/* 2. Featured Cars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              <span>Verified Fleet</span>
              <span aria-hidden="true">·</span>
              <span>Self-Drive Cars</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Featured Self-Drive Cars
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sanitized, GPS-enabled, and serviced hatchbacks, SUVs, and luxury sedans.
            </p>
          </div>

          <button
            onClick={() => triggerSearch({ type: 'car' })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111827] hover:text-black bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
          >
            <span>View All Cars ({vehicles.filter((v) => v.type === 'car').length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCars.map((car) => (
            <VehicleCard key={car.id} vehicle={car} />
          ))}
        </div>
      </section>

      {/* 3. Popular Bikes Section */}
      <section className="bg-white py-16 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                <span>Two-Wheeler Freedom</span>
                <span aria-hidden="true">·</span>
                <span>Bikes & EV Scooters</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Popular Bikes & Scooters
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                From thumpers and naked sport bikes to smart electric scooters for daily commuting.
              </p>
            </div>

            <button
              onClick={() => triggerSearch({ type: 'bike' })}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#111827] hover:text-black bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
            >
              <span>View All Bikes ({vehicles.filter((v) => v.type === 'bike').length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularBikes.map((bike) => (
              <VehicleCard key={bike.id} vehicle={bike} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Browse by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Browse by Vehicle Category
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose the body style and powertrain that best fits your travel requirement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={idx}
                onClick={() => triggerSearch({ type: cat.type })}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 text-left hover:border-gray-900 hover:shadow-md transition-all group flex flex-col justify-between h-44"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#C7F36B] text-gray-900 flex items-center justify-center transition-colors mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-black">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                    {cat.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 group-hover:text-gray-900 pt-2 border-t border-gray-100">
                  <span>{cat.count}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. How It Works (Choose -> Book -> Ride -> Return) */}
      <section id="how-it-works" className="bg-[#111827] text-white py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C7F36B]">
              Frictionless Mobility
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              How RentRide Works
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              From reservation to return in 4 straightforward steps with zero physical paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative p-6 bg-gray-800/50 rounded-2xl border border-gray-700/60 flex flex-col justify-between">
                <div>
                  <div className="text-3xl font-black text-[#C7F36B] tracking-tight mb-4 tabular-nums">
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center gap-1.5 text-[11px] text-gray-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>Standardized Quality Check</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={() => {
                setCustomerScreen('explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-[#C7F36B] hover:bg-[#bbf055] text-[#111827] rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg inline-flex items-center gap-2"
            >
              <span>Explore All Available Vehicles Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Why Choose RentRide? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Why RentRide is Loved by Renters
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Engineered for reliability, transparent billing, and peace of mind on every journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-lime-100 text-[#111827] flex items-center justify-center font-bold text-lg mb-4">
              <Shield className="w-6 h-6 text-emerald-800" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-2">Zero Hidden Deposits</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Transparent, minimal refundable security deposits credited directly back to your source account within 24 hours of return.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-2">Doorstep Delivery</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Prefer home delivery? Our trained chauffeurs deliver sanitized vehicles directly to your apartment, hotel, or airport terminal.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-2">15-Min Fast Verification</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Digital licence scanning and 24/7 dedicated fleet managers approve rental requests without tedious physical queues.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-2">24/7 Roadside Assist</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Comprehensive roadside insurance and pan-India SOS breakdown network ensures your road trip never gets stalled.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Customer Reviews */}
      <section className="bg-white py-16 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Real Experiences from RentRide Customers
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Over 48,000 trips completed with a 4.9/5 satisfaction index.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified Renter
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed mb-4 italic">
                    "{rev.text}"
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200/60">
                  <p className="font-bold text-xs text-gray-900">{rev.name}</p>
                  <p className="text-[11px] text-gray-500">{rev.role}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Rented: {rev.vehicle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (Accordion) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Everything you need to know about booking, security deposits, and rental rules.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
                      isOpen ? 'rotate-180 text-gray-900' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
