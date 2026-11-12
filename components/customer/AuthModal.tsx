'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
  KeyRound,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    setMode,
    setAdminScreen,
    signInWithSupabase,
    signUpWithSupabase,
    resendVerificationWithSupabase,
    resetPasswordWithSupabase,
    signOutWithSupabase,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  };

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setShowResendButton(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithSupabase(email, password);
      if (result.success) {
        setSuccessMsg('Signed in successfully! Welcome back to RentRide.');
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setSuccessMsg('');
          setPassword('');
        }, 500);
      } else {
        setErrorMsg(result.error || 'Invalid email or password.');
        if (result.needsEmailVerification) {
          setShowResendButton(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!isValidPhone(phone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMsg('Password must include at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUpWithSupabase({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          setSuccessMsg(
            `Account created for ${email.trim().toLowerCase()}! Check your inbox and click the verification link before signing in.`
          );
          setShowResendButton(true);
          setPassword('');
          setConfirmPassword('');
        } else {
          setSuccessMsg('Account created and verified! Signing you in...');
          setTimeout(() => {
            setIsAuthModalOpen(false);
            setSuccessMsg('');
            setPassword('');
            setConfirmPassword('');
          }, 800);
        }
      } else {
        setErrorMsg(result.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!isValidEmail(email)) {
      setErrorMsg('Enter your registered email address first.');
      return;
    }
    setIsResending(true);
    setErrorMsg('');
    try {
      const res = await resendVerificationWithSupabase(email);
      if (res.success) {
        setSuccessMsg(
          `Verification link sent to ${email.trim().toLowerCase()}. Please check your inbox and spam folder.`
        );
        setShowResendButton(false);
      } else {
        setErrorMsg(res.error || 'Unable to resend verification email right now.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordWithSupabase(email);
      if (result.success) {
        // Generic message preserves privacy (never reveals whether an email exists in the system)
        setSuccessMsg(
          `If an account is registered for ${email.trim().toLowerCase()}, a password recovery link has been sent to that inbox.`
        );
      } else {
        setErrorMsg(result.error || 'Unable to send reset request right now.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!isValidEmail(email) || !password) {
      setErrorMsg('Please enter a valid administrator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithSupabase(email, password);
      if (result.success) {
        if (result.role === 'admin' || result.role === 'fleet_manager') {
          setSuccessMsg('Fleet operations privileges verified. Opening console...');
          setTimeout(() => {
            setIsAuthModalOpen(false);
            setMode('admin');
            setAdminScreen('overview');
            setSuccessMsg('');
            setPassword('');
          }, 500);
        } else {
          // Enforce strict server-role gate: reject customer login in admin gateway
          await signOutWithSupabase();
          setErrorMsg(
            'Access Denied: This account does not possess administrator or fleet manager privileges.'
          );
        }
      } else {
        setErrorMsg(result.error || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Admin authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#111827] text-white px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {authModalMode === 'admin-login' && (
                <ShieldCheck className="w-5 h-5 text-[#C7F36B]" />
              )}
              <h3 className="text-lg font-bold">
                {authModalMode === 'login' && 'Welcome Back'}
                {authModalMode === 'register' && 'Join RentRide'}
                {authModalMode === 'forgot-password' && 'Reset Password'}
                {authModalMode === 'admin-login' && 'Fleet Operations Login'}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {authModalMode === 'login' && 'Sign in to access your bookings, profile, and KYC documents'}
              {authModalMode === 'register' && 'Create a verified customer account to book cars and bikes'}
              {authModalMode === 'forgot-password' && 'Enter your email address to receive a recovery link'}
              {authModalMode === 'admin-login' && 'Restricted access for RentRide administrators & fleet managers'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setIsAuthModalOpen(false);
            }}
            className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher for standard customer auth */}
        {(authModalMode === 'login' || authModalMode === 'register') && (
          <div className="flex border-b border-gray-100 bg-gray-50/70 p-1 m-4 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                resetMessages();
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authModalMode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('register');
                resetMessages();
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authModalMode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Alert Messages */}
        <div className="px-6 pt-2">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold">Error:</span>
                <span>{errorMsg}</span>
              </div>
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#111827] bg-white border border-red-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isResending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isResending ? 'Sending link...' : 'Resend Verification Email'}</span>
                </button>
              )}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 bg-white border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isResending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isResending ? 'Sending link...' : 'Resend Verification Email'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 1. CUSTOMER SIGN IN */}
        {authModalMode === 'login' && (
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
                  autoComplete="email"
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
                  onClick={() => {
                    resetMessages();
                    setAuthModalMode('forgot-password');
                  }}
                  className="text-[11px] text-[#111827] hover:underline font-semibold cursor-pointer"
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
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Toggle password visibility"
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
                <span>Keep me signed in on this browser</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Secure link to Admin Authentication */}
            <div className="pt-3 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('admin-login');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Fleet Manager &amp; Admin Console Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. CUSTOMER REGISTRATION */}
        {authModalMode === 'register' && (
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
                  placeholder="e.g. Senthil Kumar"
                  autoComplete="name"
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
                  placeholder="senthil@example.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number (for OTP &amp; Handover PIN)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98400 12345"
                  autoComplete="tel"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password (min. 8)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Letters & numbers"
                    autoComplete="new-password"
                    className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
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
                  I agree to the <span className="underline">Terms of Service</span>,{' '}
                  <span className="underline">Rental Agreement</span>, and consent to driving licence verification.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {authModalMode === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              Enter your registered RentRide email. If an account exists, we will dispatch a secure reset link allowing you to choose a new password.
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#111827] hover:bg-black text-[#C7F36B] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Send Password Reset Link</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('login');
                }}
                className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. FLEET OPERATIONS SECURE ADMIN SIGN IN */}
        {authModalMode === 'admin-login' && (
          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Restricted Area:</strong> This gateway requires credentials verified with the{' '}
                <code className="bg-amber-100 px-1 rounded">admin</code> or{' '}
                <code className="bg-amber-100 px-1 rounded">fleet_manager</code> role in the database.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rentride.in"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Admin Authorization...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In as Fleet Administrator</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('login');
                }}
                className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Customer Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
