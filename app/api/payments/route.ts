import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment.service';
import { requireAdminUser, recordAdminAuditLog } from '@/lib/supabase/auth-guard';
import { z } from 'zod';

const RecordPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  amount: z.number().positive('Settlement amount must be positive'),
  paymentMethod: z.enum(['UPI', 'Credit Card', 'Debit Card', 'NetBanking', 'Cash']),
  type: z
    .enum(['rental_charge', 'security_deposit', 'deposit_refund', 'cancellation_refund', 'late_fee'])
    .default('rental_charge'),
  referenceNote: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const transactions = await PaymentService.getTransactions(adminAuth.adminClient);
    return NextResponse.json({
      success: true,
      total: transactions.length,
      transactions,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const body = await req.json();
    const validated = RecordPaymentSchema.parse(body);

    // Verify booking exists and fetch authoritative customer identity for ledger integrity
    const { data: booking, error: bookingErr } = await adminAuth.adminClient
      .from('bookings')
      .select('id, user_id, customer_name, customer_email, booking_status, payment_status')
      .eq('id', validated.bookingId)
      .maybeSingle();

    if (bookingErr || !booking) {
      return NextResponse.json(
        { success: false, error: `Booking ${validated.bookingId} was not found.` },
        { status: 404 }
      );
    }

    if (validated.type === 'rental_charge') {
      if (booking.booking_status === 'cancelled' || booking.booking_status === 'rejected') {
        return NextResponse.json(
          { success: false, error: 'Cannot record rental charge for a cancelled or rejected booking.' },
          { status: 400 }
        );
      }
      if (booking.payment_status === 'paid') {
        return NextResponse.json(
          {
            success: false,
            error: `Duplicate counter settlement blocked: Rental charges for ${booking.id} are already paid.`,
          },
          { status: 409 }
        );
      }
    }

    if (
      (validated.type === 'deposit_refund' || validated.type === 'cancellation_refund') &&
      booking.payment_status === 'refunded'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate refund blocked: ${booking.id} has already been refunded.`,
        },
        { status: 409 }
      );
    }

    const customerName = validated.customerName || booking.customer_name;
    const customerEmail = validated.customerEmail || booking.customer_email;

    const result = await PaymentService.recordTransaction(
      {
        bookingId: booking.id,
        userId: booking.user_id,
        customerName,
        customerEmail,
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        type: validated.type,
      },
      adminAuth.adminClient
    );

    // Keep booking_status and payment_status strictly independent:
    // Recording a counter payment updates payment_status only, without mutating booking_status.
    if (validated.type === 'rental_charge' || validated.type === 'deposit_refund' || validated.type === 'cancellation_refund') {
      const nextPaymentStatus =
        validated.type === 'deposit_refund' || validated.type === 'cancellation_refund'
          ? 'refunded'
          : 'paid';

      await adminAuth.adminClient
        .from('bookings')
        .update({ payment_status: nextPaymentStatus })
        .eq('id', booking.id);

      const refSuffix = validated.referenceNote ? ` Ref: ${validated.referenceNote}` : '';
      await adminAuth.adminClient.from('booking_status_history').insert([
        {
          booking_id: booking.id,
          status: booking.booking_status,
          note:
            validated.type === 'rental_charge'
              ? `Counter payment of ₹${validated.amount} collected via ${validated.paymentMethod} (Txn: ${result.transactionId}).${refSuffix}`
              : `Refund of ₹${validated.amount} processed via ${validated.paymentMethod} (Txn: ${result.transactionId}).${refSuffix}`,
        },
      ]);
    }

    await recordAdminAuditLog({
      adminId: adminAuth.user.id,
      action: 'record_counter_payment',
      entityType: 'payment',
      entityId: result.transactionId,
      metadata: {
        bookingId: booking.id,
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        type: validated.type,
        referenceNote: validated.referenceNote || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        transactionId: result.transactionId,
        transaction: result.transaction,
        message: 'Counter settlement recorded in payment ledger.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || 'Validation error' },
        { status: 422 }
      );
    }
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
