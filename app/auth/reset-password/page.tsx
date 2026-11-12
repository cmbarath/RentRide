'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { updateUserPassword, signOutUser } from '@/lib/supabase/auth';
import { Car, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [linkErrorMsg, setLinkErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyRecoveryContext = async () => {
      try {
        const urlError = searchParams.get('error');
        const urlMessage = searchParams.get('message');

        // Also inspect hash fragment errors returned directly by Supabase implicit flow
        let hashErrorDesc = '';
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          hashErrorDesc = hashParams.get('error_description') || hashParams.get('error') || '';
        }

        if (urlError || hashErrorDesc) {
          if (active) {
            setLinkErrorMsg(
              urlMessage ||
                hashErrorDesc ||
                'Your password recovery link has expired or is invalid. Please request a new one.'
            );
            setHasRecoverySession(false);
            setIsCheckingSession(false);
          }
          return;
        }

        if (!isSupabaseConfigured()) {
          if (active) {
            setLinkErrorMsg('Supabase authentication is not configured.');
            setIsCheckingSession(false);
          }
          return;
        }

        const supabase = createClient();

        // Handle optional direct ?code=... parameter if redirected straight here
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            if (active) {
              setLinkErrorMsg(
                exchangeErr.message || 'Recovery link is invalid or has expired.'
              );
              setHasRecoverySession(false);
              setIsCheckingSession(false);
            }
            return;
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (active) {
          if (user) {
            setHasRecoverySession(true);
          } else {
            setLinkErrorMsg(
              'No active password recovery session found. Your reset link may have expired or already been used.'
            );
            setHasRecoverySession(false);
          }
          setIsCheckingSession(false);
        }
      } catch (err: any) {
        if (active) {
          setLinkErrorMsg(err?.message || 'Unable to verify recovery link.');
          setHasRecoverySession(false);
          setIsCheckingSession(false);
        }
      }
    };

    verifyRecoveryContext();

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session?.user)) {
          setHasRecoverySession(true);
          setLinkErrorMsg('');
          setIsCheckingSession(false);
        }
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMsg('Password must contain at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateUserPassword(password);
      if (res.success) {
        // Terminate temporary recovery session cleanly so user authenticates cleanly with new credentials
        await signOutUser();
        setSuccess(true);
      } else {
        setErrorMsg(res.error || 'Failed to update password. Your reset link may have expired.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An error occurred while updating your password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-[#1E293B] border border-gray-700/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C7F36B]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#C7F36B] flex items-center justify-center text-[#111827]">
            <Car className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-white">
              Rent<span className="text-[#C7F36B]">Ride</span>
            </span>
            <span className="block text-[10px] tracking-wider uppercase text-gray-400">
              Account Security
            </span>
          </div>
        </div>

        {isCheckingSession ? (
          <div className="py-10 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#C7F36B] mx-auto" />
            <p className="text-xs text-gray-300 font-semibold">
              Verifying secure recovery session...
            </p>
          </div>
        ) : success ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Password Updated!</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your RentRide account password has been successfully updated. Sign in now with your new credentials.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push('/?open_auth=login')}
                className="w-full py-3 bg-[#C7F36B] hover:bg-[#b5e054] text-[#111827] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : !hasRecoverySession ? (
          <div className="space-y-4 py-2">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Recovery Link Expired or Invalid
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed bg-red-950/60 border border-red-800/80 rounded-xl p-3">
              {linkErrorMsg}
            </p>
            <div className="pt-2 space-y-2.5">
              <Link
                href="/?open_auth=forgot-password"
                className="w-full py-3 bg-[#C7F36B] hover:bg-[#b5e054] text-[#111827] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Request a New Reset Link</span>
              </Link>
              <Link
                href="/"
                className="block w-full py-2.5 text-center text-xs text-gray-400 hover:text-white transition-colors"
              >
                Return to RentRide Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Choose a secure password for your RentRide account (at least 8 characters with letters and numbers).
            </p>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 chars (letters & numbers)"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C7F36B] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0F172A] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#C7F36B] transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#111827] hover:bg-black text-[#C7F36B] border border-gray-700 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel and return to RentRide
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#C7F36B]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
