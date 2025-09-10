import { adminProcedure } from "@/trpc/init";
import { createAdminSchema } from "../adminSchema";
import { db } from "@/index";
import { organization } from "@/db/schema";

export const section = {
  create: adminProcedure
    .input(createAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const newSection = await db
        .insert(organization)
        .values({
          name: input.name,
          slug: input.slug,
          userId: ctx.auth.user.id,
          createdAt: new Date(),
        })
        .returning();
      return newSection;
    }),
};
