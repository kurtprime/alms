"use server";

import { auth } from "@/lib/auth"; // Your better-auth instance
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const name = formData.get("name") as string;
  const image = formData.get("image") as string;

  try {
    await auth.api.updateUser({
      body: { name, image },
      headers: await headers(), // Pass headers for session context
    });

    revalidatePath("/settings");
    return { success: true, message: "Profile updated successfully!" };
  } catch {
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}

export async function changePassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
    return { success: false, message: "All fields are required." };
  }

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: await headers(),
    });

    return { success: true, message: "Password changed successfully!" };
  } catch {
    return {
      success: false,
      message: "Failed to change password",
    };
  }
}

export async function sendVerificationEmail() {
  try {
    // Note: Ensure your auth config has sendVerificationEmail implemented
    await auth.api.sendVerificationEmail({
      body: { email: "" }, // Better Auth usually grabs email from session
      headers: await headers(),
    });
    return { success: true, message: "Verification email sent!" };
  } catch {
    return { success: false, message: "Failed to send email" };
  }
}
