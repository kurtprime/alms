import { nextCookies } from "better-auth/next-js";
import {
  adminClient,
  organizationClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin as adminRole, student, teacher, user } from "./permission";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  plugins: [
    adminClient({
      ac,
      roles: {
        adminRole,
        user,
        student,
        teacher,
      },
    }),
    usernameClient(),
    organizationClient(),
    nextCookies(),
  ],
});

export const { signIn, signUp, useSession } = authClient;
