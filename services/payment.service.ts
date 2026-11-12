/**
 * PAYMENT & LEDGER SERVICE
 * Manages counter rental settlement transactions, security deposit records, and refunds via Supabase.
 */

import { Transaction, PaymentMethod } from '@/types/payment';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { mapTransactionFromDb } from '@/lib/supabase/mappers';
import type { SupabaseClient } from '@supabase/supabase-js';

function resolveAdminClient(client?: SupabaseClient): SupabaseClient {
  if (client) return client;
  if (typeof window === 'undefined' && isAdminConfigured()) {
    return createAdminClient();
  }
  return createClient();
}

export class PaymentService {
  /**
   * Records a counter/in-person rental, deposit, or refund transaction in PostgreSQL ledger.
   */
  static async recordTransaction(
    params: {
      bookingId: string;
      userId?: string | null;
      customerName: string;
      customerEmail: string;
      amount: number;
      paymentMethod: PaymentMethod;
      type?: 'rental_charge' | 'security_deposit' | 'deposit_refund' | 'cancellation_refund' | 'late_fee';
      status?: 'success' | 'pending' | 'refunded' | 'failed';
    },
    client?: SupabaseClient
  ): Promise<{ success: boolean; transactionId: string; transaction?: Transaction }> {
    const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const txType = params.type || 'rental_charge';
    const txStatus =
      params.status ||
      (txType === 'deposit_refund' || txType === 'cancellation_refund' ? 'refunded' : 'success');

    const transaction: Transaction = {
      id: txnId,
      bookingId: params.bookingId,
      customerId: params.userId || undefined,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      transactionDate: formattedDate,
      status: txStatus,
      type: txType,
    };

    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            id: txnId,
            booking_id: params.bookingId,
            user_id: params.userId || null,
            customer_name: params.customerName,
            customer_email: params.customerEmail,
            amount: params.amount,
            payment_method: params.paymentMethod,
            status: txStatus,
            type: txType,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase payment ledger write failed:', error);
        throw new Error(error.message || 'Failed to record payment transaction in ledger.');
      }

      return {
        success: true,
        transactionId: txnId,
        transaction: data ? mapTransactionFromDb(data) : transaction,
      };
    }

    return { success: true, transactionId: txnId, transaction };
  }

  /**
   * Retrieves transaction ledger history from PostgreSQL
   */
  static async getTransactions(client?: SupabaseClient): Promise<Transaction[]> {
    if (isSupabaseConfigured()) {
      const supabase = resolveAdminClient(client);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Failed to fetch payment ledger records.');
      }

      return (data || []).map(mapTransactionFromDb);
    }

    return [];
  }
}
