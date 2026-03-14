'use server';

import { auth } from '@/lib/auth';
import { user } from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/index';

/**
 * Checks if any users exist in the database.
 */
export async function checkSetupStatus() {
  const [result] = await db.select({ count: count() }).from(user);
  return result.count === 0;
}

/**
 * Creates the first admin user.
 * SECURITY: Only works if the database has zero users.
 */
export async function createFirstAdmin(formData: FormData) {
  const isEmpty = await checkSetupStatus();

  if (!isEmpty) {
    throw new Error('Setup is already complete.');
  }

  const name = formData.get('name') as string;
  const username = formData.get('username') as string; // GET USERNAME
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  // 2. Validation (optional but recommended)
  if (!username) {
    throw new Error('Username is required');
  }

  try {
    // 1. Create user using standard Better Auth API
    const { user: newUser } = await auth.api.signUpEmail({
      body: { email, password, name, username },
    });

    if (!newUser) throw new Error('Failed to create user.');

    // 2. Force elevate to Admin directly in DB
    await db.update(user).set({ role: 'admin' }).where(eq(user.id, newUser.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message || 'Setup failed');
  }
  redirect('/admin/users');
}
