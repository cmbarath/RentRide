import crypto from 'crypto';

/**
 * Generates an ephemeral, email-confirmed customer QA user in Supabase Auth for
 * isolated multi-tenant security and API tests without relying on persistent fake users.
 */
export async function createEphemeralQaCustomer(adminClient, label = 'qa') {
  const uniq = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const email = `qa.${label}.${uniq}@rentride-qa.test`;
  const password = `QaTmp#${crypto.randomBytes(12).toString('base64url')}9!`;
  const phone = `900${String(crypto.randomInt(1000000, 9999999))}`;
  const fullName = `QA Ephemeral ${label.toUpperCase()}`;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (error || !data?.user?.id) {
    throw new Error(`Failed creating ephemeral QA customer (${label}): ${error?.message || 'unknown'}`);
  }

  return {
    id: data.user.id,
    email,
    password,
    phone,
    fullName,
  };
}

/**
 * Removes all temporary bookings, licences, storage files, profiles, and Auth accounts
 * belonging strictly to the provided ephemeral QA user IDs.
 */
export async function cleanupEphemeralQaUsers(adminClient, userIds) {
  for (const uid of Array.from(new Set(userIds.filter(Boolean)))) {
    const { data: userBookings } = await adminClient
      .from('bookings')
      .select('id')
      .eq('user_id', uid);
    const bIds = (userBookings || []).map((b) => b.id);
    if (bIds.length) {
      await adminClient.from('payments').delete().in('booking_id', bIds);
      await adminClient.from('reviews').delete().in('booking_id', bIds);
      await adminClient.from('notification_logs').delete().in('booking_id', bIds);
      await adminClient.from('booking_status_history').delete().in('booking_id', bIds);
      await adminClient.from('bookings').delete().in('id', bIds);
    }

    await adminClient.from('reviews').delete().eq('user_id', uid);
    await adminClient.from('payments').delete().eq('user_id', uid);
    await adminClient.from('driving_licences').delete().eq('user_id', uid);

    const { data: dlFiles } = await adminClient.storage.from('driving-licences').list(uid, { limit: 100 });
    if (dlFiles?.length) {
      await adminClient.storage.from('driving-licences').remove(dlFiles.map((f) => `${uid}/${f.name}`));
    }

    await adminClient.from('profiles').delete().eq('id', uid);
    await adminClient.auth.admin.deleteUser(uid);
  }
}
