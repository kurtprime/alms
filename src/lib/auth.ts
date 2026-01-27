import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "..";
import * as schema from "../db/schema";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
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
  rateLimit: {
    enabled: true,
    window: 10, // time window in seconds
    max: 100, // max requests in the window
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
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
      },
    }),
    username(),
    // customSession(async ({ user, session }) => {
    //   // Enrich session with custom data (e.g., user preferences, roles, etc.)
    //   return {
    //     ...session,
    //     ...user,
    //     // Add custom fields
    //     preferences: user.preferences || {},
    //     // You can fetch additional data from your database here
    //   };
    // }),
    nextCookies(),
  ],
});
