import { adminProcedure } from "@/trpc/init";
import {
  createStudentFormSchema,
  createTeacherFormSchema,
  getManyStudentsSchema,
  getManyTeachersSchema,
} from "../adminSchema";
import { auth } from "@/lib/auth";
import { db } from "@/index";
import { member, organization, user } from "@/db/schema";
import { customAlphabet } from "nanoid";
import { desc, eq } from "drizzle-orm";

export const users = {
  createStudent: adminProcedure
    .input(createStudentFormSchema)
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

  createTeacher: adminProcedure
    .input(createTeacherFormSchema)
    .mutation(async ({ input }) => {
      const { firstName, lastName } = input;
      const fullName = `${lastName}, ${firstName}`;

      const cleanLastName = lastName
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const nanoid = customAlphabet("0123456789", 4);
      const randomPart = nanoid();
      const username = `${cleanLastName}.${randomPart}`;

      await auth.api.createUser({
        body: {
          email: `${username}@example.com`, // required
          password: "password", // required
          name: fullName, // required
          role: "teacher",
          data: {
            username: username,
          },
        },
      });
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
            username: user.username,
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
        .where(eq(user.role, "student"))
        .orderBy(desc(user.createdAt));
      return students;
    }),

  getManyTeachers: adminProcedure
    .input(getManyTeachersSchema)
    .query(async () => {
      const teachers = await db
        .select({
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
            role: user.role,
            username: user.username,
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
        .where(eq(user.role, "teacher"))
        .orderBy(desc(user.createdAt));

      return teachers;
    }),
};
