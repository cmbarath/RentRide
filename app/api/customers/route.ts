import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '@/services/customer.service';
import { requireAdminUser } from '@/lib/supabase/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await requireAdminUser(req);
    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const customers = await CustomerService.getCustomers(adminAuth.adminClient);
    return NextResponse.json({
      success: true,
      total: customers.length,
      customers,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
