import { adminProcedure } from "@/trpc/init";
import { createUserFormSchema, getManyStudentsSchema } from "../adminSchema";
import { auth } from "@/lib/auth";
import { db } from "@/index";
import { member, organization, user } from "@/db/schema";
import { customAlphabet } from "nanoid";
import { desc, eq, ilike, or } from "drizzle-orm";

export const users = {
  createStudent: adminProcedure
    .input(createUserFormSchema)
    .mutation(async ({ input }) => {
      const { firstName, lastName, organizationId } = input;
      const fullName = `${lastName}, ${firstName}`;

      const cleanLastName = lastName
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const nanoid = customAlphabet("0123456789", 4);
      const randomPart = nanoid();
      const username = `${cleanLastName}.${randomPart}`;

      const {
        user: { id },
      } = await auth.api.createUser({
        body: {
          email: `${username}@example.com`, // required
          password: "password", // required
          name: fullName, // required
          role: "student",
          data: {
            username: username,
          },
        },
      });

      if (organizationId) {
        await db.insert(member).values({
          userId: id,
          organizationId: organizationId,
          role: "student",
        });
      }
    }),

  getManyStudents: adminProcedure
    .input(getManyStudentsSchema)
    .query(async () => {
      const students = await db
        .select({
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
            role: user.role,
          },
          member: {
            id: member.id,
            role: member.role,
          },
          organization: {
            id: organization.id,
            name: organization.name,
            logo: organization.logo,
            slug: organization.slug,
          },
        })
        .from(user)
        .leftJoin(member, eq(user.id, member.userId))
        .leftJoin(organization, eq(member.organizationId, organization.id))
        .where(eq(user.role, "student"));

      return students;
    }),
};
