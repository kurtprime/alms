"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ProfileFormValues, PasswordFormValues } from "./schema";

// Helper to get the current session headers
const getAuthHeaders = async () => {
  return await headers();
};

export async function updateProfile(data: ProfileFormValues) {
  try {
    await auth.api.updateUser({
      body: { name: data.name },
      headers: await getAuthHeaders(),
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return { success: false, message };
  }
}

export async function updateAvatar(imageUrl: string) {
  try {
    await auth.api.updateUser({
      body: { image: imageUrl },
      headers: await getAuthHeaders(),
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: "Failed to update avatar" };
  }
}

export async function changePassword(data: PasswordFormValues) {
  try {
    await auth.api.changePassword({
      body: {
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
      },
      headers: await getAuthHeaders(),
    });
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to change password";
    return { success: false, message };
  }
}

export async function initiate2FA(password: string) {
  try {
    const response = await auth.api.enableTwoFactor({
      body: { password },
      headers: await getAuthHeaders(),
    });
    // Returns totpURI and backupCodes
    return { success: true, data: response };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to initiate 2FA";
    return { success: false, message };
  }
}

export async function verify2FA(code: string) {
  try {
    await auth.api.verifyTOTP({
      body: { code },
      headers: await getAuthHeaders(),
    });
    // After verifying, generate backup codes to show the user
    // Note: generateBackupCodes might require password again depending on config,
    // but usually verifyTOTP confirms the setup.
    const backup = await auth.api.generateBackupCodes({
      body: { password: "" }, // Check if password is needed, often is for security
      headers: await getAuthHeaders(),
    });

    return { success: true, backupCodes: backup.backupCodes };
  } catch (error: unknown) {
    return { success: false, message: "Invalid verification code" };
  }
}

export async function disable2FA(password: string) {
  try {
    await auth.api.disableTwoFactor({
      body: { password },
      headers: await getAuthHeaders(),
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: "Failed to disable 2FA" };
  }
}
