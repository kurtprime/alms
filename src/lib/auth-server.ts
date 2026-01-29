"use server";
import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import { Session } from "./auth-client";
import { AuthUser } from "@/db/schema";

interface CustomSession {
  session: Session;
  user: AuthUser;
}

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  // const errorMessage = {
  //   error: true,
  //   message: "You are not authorized to access this page",
  // };

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
    headers: await headers(), // you need to pass the headers object.
  });

  if (!session) {
    redirect("/sign-in");
  }
  if (!session.user) {
  }

  return { ...session };
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  return { ...session };
}
