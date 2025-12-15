import { adminProcedure } from "@/trpc/init";
import {
  createStudentFormSchema,
  createTeacherFormSchema,
  getManyStudentsSchema,
  getManyTeachersSchema,
  updateStudentFormSchema,
} from "../adminSchema";
import { auth } from "@/lib/auth";
import { db } from "@/index";
import { member, organization, user } from "@/db/schema";
import { customAlphabet, nanoid } from "nanoid";
import { and, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";

export const users = {
  createStudent: adminProcedure
    .input(createStudentFormSchema)
    .mutation(async ({ input }) => {
      const {
        firstName,
        lastName,
        organizationId,
        middleInitial,
        userId,
        strand,
      } = input;
      const fullName = `${lastName}, ${firstName}`;

      const cleanLastName = lastName
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const userID = `${userId}`.slice(-3);
      const username = `${cleanLastName}.${userID}`;

      if (await isCustomIdTaken(userId))
        throw new TRPCError({
          code: "CONFLICT",
          message: "Student ID is already taken",
        });

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
      await db
        .update(user)
        .set({ customId: userId, middleInitial })
        .where(eq(user.id, id));

      if (organizationId) {
        await Promise.all([
          db.insert(member).values({
            id: nanoid(),
            userId: id,
            organizationId,
            role: "student",
            strand,
          }),
        ]);
      }
      async function isCustomIdTaken(customId: string): Promise<boolean> {
        const result = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.customId, customId))
          .limit(1);

        return result.length > 0;
      }
    }),
  updateStudent: adminProcedure
    .input(updateStudentFormSchema)
    .mutation(async ({ input }) => {
      const {
        id, // user ID to identify the student
        userId: newCustomId,
        firstName,
        lastName,
        middleInitial,
        organizationId,
        strand,
      } = input;

      // 1. Find the existing student
      const existingStudent = await db
        .select({
          id: user.id,
          customId: user.customId,
          name: user.name,
          username: user.username,
          email: user.email,
        })
        .from(user)
        .where(and(eq(user.role, "student"), eq(user.id, id)))
        .limit(1)
        .execute();

      if (existingStudent.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      const student = existingStudent[0];
      const requiresAuthUpdate: string[] = [];
      const userID = `${newCustomId}`.slice(-3);
      const newUsername = `${lastName
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "")}.${userID}`;

      // 2. Check for duplicate customId if changing
      if (newCustomId && newCustomId !== student.customId) {
        const isTaken = await isCustomIdTaken(newCustomId);
        if (isTaken) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "New Student ID is already taken",
          });
        }
      }

      // 3. Prepare name updates
      if (firstName || lastName) {
        const currentName = student.name.split(", ");
        const currentLastName = currentName[0] || "";
        const currentFirstName = currentName[1] || "";

        const newLastName = lastName || currentLastName;
        const newFirstName = firstName || currentFirstName;
        const newFullName = `${newLastName}, ${newFirstName}`;

        if (newFullName !== student.name) {
          requiresAuthUpdate.push("name");
        }
      }

      // 4. Prepare other user updates

      await db.transaction(async (tx) => {
        // 5a. Update BetterAuth user if needed
        if (requiresAuthUpdate.length > 0) {
          try {
            await auth.api.adminUpdateUser({
              body: {
                userId: student.id,
                data: {
                  username: newUsername,
                  middleInitial: middleInitial,
                  name: `${lastName}, ${firstName}`,
                  updatedAt: new Date(),
                },
              },
              headers: await headers(),
            });
          } catch (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to update authentication system",
              cause: error,
            });
          }
        }
        await tx
          .update(user)
          .set({ customId: newCustomId, middleInitial: middleInitial })
          .where(eq(user.id, id));

        const userHasOrg = await tx
          .select({ id: member.id })
          .from(member)
          .where(eq(member.userId, id))
          .limit(1);
        if (userHasOrg.length === 0) {
          await tx.insert(member).values({
            id: nanoid(),
            userId: id,
            organizationId: organizationId || "",
            role: "student",
            strand: strand,
          });
        } else {
          await tx
            .update(member)
            .set({
              strand: strand,
              organizationId: organizationId || "",
            })
            .where(eq(member.userId, id));
        }
      });
      async function isCustomIdTaken(customId: string): Promise<boolean> {
        const result = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.customId, customId))
          .limit(1);

        return result.length > 0;
      }
      return {
        success: true,
        message: "Student updated successfully",
        studentId: newCustomId || student.customId,
      };
    }),

  // Helper function remains the same

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
    .query(async ({ input }) => {
      const { userId, organizationId, strand, search, limit } = input;

      // Build dynamic conditions
      const conditions: SQL<unknown>[] = [eq(user.role, "student")];

      if (userId) conditions.push(eq(user.id, userId));
      if (organizationId) conditions.push(eq(organization.id, organizationId));

      // ✅ FIX: Use latestMember.strand, not member.strand
      if (strand) conditions.push(eq(member.strand, strand));

      // ✅ FIX: Simplified search logic with null check
      if (search?.trim()) {
        conditions.push(
          or(
            ilike(user.name, `%${search}%`),
            ilike(user.customId, `%${search}%`),
            ilike(user.username, `%${search}%`),
            ilike(organization.name, `%${search}%`)
          ) as SQL<unknown>
        );
      }

      const students = await db
        .select({
          user: {
            id: user.id,
            name: user.name,
            middleInitial: user.middleInitial,
            image: user.image,
            username: user.username,
            customId: user.customId,
          },
          organization: {
            id: organization.id,
            name: organization.name,
            logo: organization.logo,
            slug: organization.slug,
          },
          member: {
            strand: member.strand,
          },
        })
        .from(user)
        .leftJoin(member, eq(user.id, member.userId))
        .leftJoin(organization, eq(member.organizationId, organization.id))
        .where(and(...conditions))
        .orderBy(desc(user.createdAt))
        .limit(limit ?? 50);

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
        .where(eq(user.role, "teacher"))
        .leftJoin(member, eq(user.id, member.userId))
        .leftJoin(organization, eq(member.organizationId, organization.id))
        .orderBy(desc(user.createdAt));

      return teachers;
    }),
};
