import { adminProcedure } from "@/trpc/init";
import { createSectionFormSchema, getManySectionsSchema } from "../adminSchema";
import { db } from "@/index";
import { member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
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

  getManySections: adminProcedure
    .input(getManySectionsSchema)
    .query(async ({ input }) => {
      const { name, slug } = input;
      const data = await db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          createdAt: organization.createdAt,
          // Count students for each organization
          studentCount: db.$count(
            member,
            and(
              eq(member.organizationId, organization.id), // Correlate with outer query
              eq(member.role, "student") // Filter by role
            )
          ),
        })
        .from(organization)
        .where(
          or(
            name ? ilike(organization.name, `%${name}%`) : undefined,
            slug ? ilike(organization.slug, `%${slug}%`) : undefined
          )
        )
        .orderBy(desc(organization.createdAt));
      //await waitFor(5000);
      return data;
    }),
};
