import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Mail, Lock, User, Phone, Check, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    loginAs,
    registerUser,
    setMode,
    setAdminScreen,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    const success = loginAs(email);
    if (success) {
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMsg('');
      }, 500);
    } else {
      setErrorMsg('Account not found with this email. Try quick demo accounts below or register.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName || !email || !phone || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    registerUser(fullName, email, phone);
    setSuccessMsg('Account created successfully! Welcome to RentRide.');
    setTimeout(() => {
      setIsAuthModalOpen(false);
      setSuccessMsg('');
    }, 600);
  };

  const quickDemoLogin = (userEmail: string) => {
    loginAs(userEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-[#111827] text-white px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {authModalMode === 'login' ? 'Welcome Back' : 'Join RentRide'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {authModalMode === 'login'
                ? 'Sign in to access your bookings and KYC documents'
                : 'Create an account to book premium cars and bikes'}
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1 m-4 rounded-xl">
          <button
            onClick={() => {
              setAuthModalMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalMode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthModalMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalMode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alert Messages */}
        <div className="px-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
              <span className="font-bold">Error:</span> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        {authModalMode === 'login' ? (
          <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('A password reset link would be dispatched to your registered email.')}
                  className="text-[11px] text-[#111827] hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#111827] focus:ring-[#111827]"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Switcher */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Quick Demo Accounts (1-Click)
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('rohan.sharma@gmail.com')}
                  className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-gray-800">Rohan Sharma</span>
                    <span className="text-gray-400 ml-1.5">· 6 Bookings · Verified KYC</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#111827] bg-[#C7F36B] px-2 py-0.5 rounded">
                    Load
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('priya.nambiar@outlook.com')}
                  className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-gray-800">Priya Nambiar</span>
                    <span className="text-gray-400 ml-1.5">· 1 Booking · Pending KYC</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#111827] bg-[#C7F36B] px-2 py-0.5 rounded">
                    Load
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setMode('admin');
                    setAdminScreen('overview');
                  }}
                  className="w-full text-left p-2 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-xs flex items-center justify-between text-blue-900"
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Fleet Administrator Console</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                    Switch to Admin
                  </span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="px-6 pb-6 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Full Name (as per Driving Licence)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arjun Kapoor"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number (for OTP & Handover)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-[#111827] mt-0.5"
                />
                <span className="text-[11px] leading-tight">
                  I agree to the <span className="underline">Terms of Service</span>, <span className="underline">Rental Agreement</span>, and consent to driving licence verification.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
