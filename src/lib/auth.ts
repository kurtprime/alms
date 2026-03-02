import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "..";
import * as schema from "../db/schema";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { ac, admin, student, teacher, user } from "./permission";
import { username } from "better-auth/plugins/username";
import { sendEmail } from "@/services/mailbit/mailer";
import { getPasswordResetHtml } from "@/services/mailbit/templates/password-reset";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: {
      ...schema,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      const htmlContent = getPasswordResetHtml(url, user.name);
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: htmlContent,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
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

    nextCookies(),
  ],
});
