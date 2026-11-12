import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockRefreshPublicReviews = vi.fn(async () => {});
const mockRefreshVehicles = vi.fn(async () => {});

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    vehicles: [
      { id: 'veh-1', name: 'Hyundai Creta SX' },
      { id: 'veh-2', name: 'Royal Enfield Classic 350' },
    ],
    refreshPublicReviews: mockRefreshPublicReviews,
    refreshVehicles: mockRefreshVehicles,
    formatDisplayDate: (iso: string) => iso.slice(0, 10),
  }),
}));

import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminReviews } from '@/components/admin/AdminReviews';

describe('AdminSettings Component', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('loads settings, rejects out-of-range speed limit without submitting, and saves valid updates', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET') {
        return new Response(
          JSON.stringify({
            success: true,
            settings: {
              companyName: 'RentRide Mobility Private Limited',
              gstin: '33AABCR8721K1ZM',
              supportPhone: '+91 800-RENTRIDE',
              supportEmail: 'support@rentride.in',
              emergencyPhone: '1800-209-9090',
              speedLimit: 120,
              minDriverAge: 21,
              fuelPolicy: 'same_to_same',
              cancellationGraceHours: 6,
            },
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });
    global.fetch = fetchMock as typeof fetch;

    render(<AdminSettings />);

    const speedInput = (await screen.findByDisplayValue('120')) as HTMLInputElement;
    const graceInput = screen.getByDisplayValue('6') as HTMLInputElement;
    const saveButton = screen.getByRole('button', { name: /save platform settings/i });

    await waitFor(() => expect(saveButton).not.toBeDisabled());

    // Invalid speedLimit < 40 should trigger inline error and NOT PATCH
    await user.clear(speedInput);
    await user.type(speedInput, '15');
    await user.click(saveButton);

    expect(
      await screen.findByText('Speed governor limit must be between 40 and 200 km/h.')
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // Only initial GET

    // Fix speedLimit and update grace hours -> sends PATCH
    await user.clear(speedInput);
    await user.type(speedInput, '110');
    await user.clear(graceInput);
    await user.type(graceInput, '8');
    await user.click(saveButton);

    expect(
      await screen.findByText('Platform settings saved to Supabase database.')
    ).toBeInTheDocument();

    const patchCall = fetchMock.mock.calls.find((call) => call[1]?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    const payload = JSON.parse(String(patchCall?.[1]?.body));
    expect(payload.speedLimit).toBe(110);
    expect(payload.cancellationGraceHours).toBe(8);
  });
});

describe('AdminReviews Component', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('filters approved/hidden reviews and triggers Hide, Approve, and Delete moderation actions', async () => {
    const user = userEvent.setup();
    let currentReviews = [
      {
        id: 'rev-1',
        booking_id: 'bkg-1',
        vehicle_id: 'veh-1',
        user_name: 'Barath M',
        rating: 5,
        comment: 'Clean SUV and punctual airport pickup!',
        is_approved: true,
        created_at: '2027-05-05T10:00:00Z',
      },
      {
        id: 'rev-2',
        booking_id: 'bkg-2',
        vehicle_id: 'veh-2',
        user_name: 'Chitra',
        rating: 3,
        comment: 'Bike mirror needed tightening before ride.',
        is_approved: false,
        created_at: '2027-05-06T12:00:00Z',
      },
    ];

    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const target = String(url);
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET' && target.includes('/api/reviews')) {
        return new Response(JSON.stringify({ success: true, reviews: currentReviews }), {
          status: 200,
        });
      }
      if (method === 'PATCH' && target.endsWith('/rev-1')) {
        currentReviews = currentReviews.map((r) =>
          r.id === 'rev-1' ? { ...r, is_approved: false } : r
        );
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (method === 'DELETE' && target.endsWith('/rev-2')) {
        currentReviews = currentReviews.filter((r) => r.id !== 'rev-2');
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: false, error: 'Unhandled mock' }), {
        status: 400,
      });
    });
    global.fetch = fetchMock as typeof fetch;

    render(<AdminReviews />);

    expect(await screen.findByText('Barath M')).toBeInTheDocument();
    expect(screen.getByText('Chitra')).toBeInTheDocument();

    // Filter Hidden
    await user.click(screen.getByRole('button', { name: /hidden \(1\)/i }));
    expect(screen.queryByText('Barath M')).not.toBeInTheDocument();
    expect(screen.getByText('Chitra')).toBeInTheDocument();

    // Return to All
    await user.click(screen.getByRole('button', { name: /all \(2\)/i }));

    // Hide rev-1
    await user.click(screen.getByRole('button', { name: /hide review/i }));
    expect(
      await screen.findByText('Review by Barath M marked as Hidden (Unapproved).')
    ).toBeInTheDocument();
    expect(mockRefreshPublicReviews).toHaveBeenCalled();
    expect(mockRefreshVehicles).toHaveBeenCalledWith(true);

    // Delete rev-2
    const deleteButtons = screen.getAllByTitle('Delete review');
    await user.click(deleteButtons[1]);
    expect(await screen.findByText('Review by Chitra permanently removed.')).toBeInTheDocument();
  });
});
