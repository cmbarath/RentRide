export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking' | 'Cash';

export type TransactionType =
  | 'rental_charge'
  | 'security_deposit'
  | 'deposit_refund'
  | 'cancellation_refund'
  | 'late_fee';

export type TransactionStatus = 'success' | 'pending' | 'refunded' | 'failed';

export interface Transaction {
  id: string;
  bookingId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  status: TransactionStatus;
  type: TransactionType;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  refundReason?: string;
}
