import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user?.role !== "admin") {
    redirect("/");
  }

  return { ...session };
}

export async function getCurrentStudent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return { ...session };
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }
  return { ...session };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred.";
}

// 1. Enable 2FA (Generates QR Code URI)
export async function enableTwoFactor(password: string) {
  try {
    const response = await auth.api.enableTwoFactor({
      body: { password },
      headers: await headers(),
    });
    return { success: true, data: response };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function verifySetupTOTP(code: string) {
  try {
    await auth.api.verifyTOTP({
      body: { code },
      headers: await headers(),
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// 3. Disable 2FA
export async function disableTwoFactor(password: string) {
  try {
    await auth.api.disableTwoFactor({
      body: { password },
      headers: await headers(),
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// 4. Send OTP to Email (During Login)
export async function sendTwoFactorOTP() {
  try {
    await auth.api.sendTwoFactorOTP({
      headers: await headers(),
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// 5. Verify OTP (During Login - Email/SMS)
export async function verifyTwoFactorOTP(code: string) {
  try {
    await auth.api.verifyTwoFactorOTP({
      body: { code },
      headers: await headers(),
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}
