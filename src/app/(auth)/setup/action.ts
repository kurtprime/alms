"use server";

import { auth } from "@/lib/auth";
import { user } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/index";

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
    throw new Error("Setup is already complete.");
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  try {
    // 1. Create the user using standard signup
    // We pass headers() to simulate a request context
    const { user: newUser } = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: await headers(),
    });

    if (!newUser) {
      throw new Error("Failed to create user.");
    }

    // 2. Force elevate to Admin (Direct DB Update)
    // We do this because admin.createUser requires an existing admin session.
    await db.update(user).set({ role: "admin" }).where(eq(user.id, newUser.id));
  } catch (error) {
    console.error(error);
    throw error; // Rethrow to show error in UI
  }

  redirect("/sign-in?message=setup_complete");
}
