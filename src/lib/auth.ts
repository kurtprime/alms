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
    // customSession(async ({ user, session }: {
    //   user: AuthUser;
    //   session: Session
    // }) => {
    //   // Enrich session with custom data (e.g., user preferences, roles, etc.)
    //   return {
    //     session,
    //     user: {
    //       ...user,
    //       onBoarded: "on_boarded",
    //     },
    //     // Add custom fields
    //     // You can fetch additional data from your database here
    //   };
    // }),
    nextCookies(),
  ],
});
