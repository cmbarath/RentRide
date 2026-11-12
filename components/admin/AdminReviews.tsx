'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PublicReviewItem } from '@/types';
import {
  Star,
  CheckCircle2,
  EyeOff,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  MessageSquare,
} from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const { vehicles, refreshPublicReviews, refreshVehicles, formatDisplayDate } = useApp();

  const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'approved' | 'unapproved'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAllReviews = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/reviews', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to load reviews.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error fetching customer reviews.' });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllReviews();
  }, [loadAllReviews]);

  const handleToggleApproval = async (review: PublicReviewItem, nextApproved: boolean) => {
    setBusyId(review.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(review.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isApproved: nextApproved }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update review moderation status.' });
      } else {
        await Promise.all([loadAllReviews(true), refreshPublicReviews(), refreshVehicles(true)]);
        setFeedback({
          type: 'success',
          message: `Review by ${review.user_name} marked as ${nextApproved ? 'Approved (Live)' : 'Hidden (Unapproved)'}.`,
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error moderating review.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteReview = async (review: PublicReviewItem) => {
    setBusyId(review.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(review.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete review.' });
      } else {
        await Promise.all([loadAllReviews(true), refreshPublicReviews(), refreshVehicles(true)]);
        setFeedback({ type: 'success', message: `Review by ${review.user_name} permanently removed.` });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error deleting review.' });
    } finally {
      setBusyId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'approved') return r.is_approved;
    if (filter === 'unapproved') return !r.is_approved;
    return true;
  });

  const approvedCount = reviews.filter((r) => r.is_approved).length;
  const hiddenCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Customer Review Moderation
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Approve, hide, or remove customer vehicle reviews and synchronize public ratings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAllReviews(false)}
          className="px-3.5 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 self-start sm:self-auto cursor-pointer"
        >
          Refresh Reviews
        </button>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.message}
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Total Reviews Submitted</div>
          <div className="text-2xl font-black text-gray-900">{reviews.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Approved &amp; Published</div>
          <div className="text-2xl font-black text-emerald-600">{approvedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-xs text-gray-500 font-semibold mb-1">Hidden / Unapproved</div>
          <div className="text-2xl font-black text-amber-600">{hiddenCount}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold w-fit">
          {(
            [
              { id: 'all', label: `All (${reviews.length})` },
              { id: 'approved', label: `Approved (${approvedCount})` },
              { id: 'unapproved', label: `Hidden (${hiddenCount})` },
            ] as const
          ).map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#111827] text-[#C7F36B] shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading customer reviews...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-semibold text-gray-700">No reviews match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((r) => {
              const veh = vehicles.find((v) => v.id === r.vehicle_id);
              const isBusy = busyId === r.id;
              return (
                <div
                  key={r.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{r.user_name}</span>
                      <span className="text-gray-400 font-mono text-[11px]">Booking {r.booking_id}</span>
                      {r.is_approved ? (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          Approved
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          Hidden / Unapproved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">{veh?.name || r.vehicle_id}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                    <span className="text-[10px] text-gray-400 block">
                      Submitted {formatDisplayDate(r.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.is_approved ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleApproval(r, false)}
                        className="px-3 py-1.5 border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>Hide Review</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleApproval(r, true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Approve Review</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDeleteReview(r)}
                      className="p-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl disabled:opacity-50 cursor-pointer"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
