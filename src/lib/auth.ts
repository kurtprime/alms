import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "..";
import * as schema from "../db/schema";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ac, admin, student, teacher, user } from "./permission";
import { username } from "better-auth/plugins/username";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: {
      ...schema,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
        student,
        teacher,
      },
    }),
    organization({
      ac,
      roles: {
        admin,
        student,
        teacher,
      }
    }),
    username(),
    nextCookies(),
  ],
});

export async function getCurrentAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  // const errorMessage = {
  //   error: true,
  //   message: "You are not authorized to access this page",
  // };

  if (!session?.user) {
    redirect("/sign-in");
  }
  if (session.user?.role !== "admin") {
    if (session.user.role === "students") redirect("/students");
    if (session.user.role === "teacher") redirect("/teacher");
    redirect("/");
  }

  return { ...session };
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  return { ...session };
}
