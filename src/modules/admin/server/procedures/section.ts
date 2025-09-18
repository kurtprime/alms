import { adminProcedure } from "@/trpc/init";
import { createSectionFormSchema } from "../adminSchema";
import { db } from "@/index";
import { organization } from "@/db/schema";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generateAvatar } from "@/lib/avatar";
import { headers } from "next/headers";

export const section = {
  create: adminProcedure
    .input(createSectionFormSchema)
    .mutation(async ({ input, ctx }) => {
      const checkSlug = await auth.api.checkOrganizationSlug({
        body: {
          slug: input.slug, // required
        },
      });
      if (!checkSlug.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization with this slug already exists data status",
        });
      }
      await auth.api.createOrganization({
        body: {
          name: input.name,
          slug: input.slug,
          userId: ctx.auth.user.id,
        },
        headers: await headers(),
      });

    }),

  getManySections: adminProcedure.query(async ({ ctx }) => {
    const data = await db.select().from(organization).orderBy(desc(organization.createdAt));

    return data;
  }),
};
