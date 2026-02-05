import {
  classSubjects,
  member,
  organization,
  subjectName,
  subjects,
  user,
  userRoleEnum,
} from "@/db/schema";
import { db } from "@/index";
import { getManySectionsSchema } from "@/modules/admin/server/adminSchema";
import { adminProcedure, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { role } from "better-auth/plugins/access";
import { and, desc, eq, ilike, not, or } from "drizzle-orm";

export const sectionActions = {
  getManySections: protectedProcedure
    .input(getManySectionsSchema)
    .query(async ({ input, ctx }) => {
      const { auth } = ctx;
      if (auth.user.role !== "teacher") {
        throw new Error("Only teachers can access sections");
      }
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
              eq(member.role, "student"), // Filter by role
            ),
          ),
        })
        .from(organization)
        .where(
          or(
            name ? ilike(organization.name, `%${name}%`) : undefined,
            slug ? ilike(organization.slug, `%${slug}%`) : undefined,
          ),
        )
        .orderBy(desc(organization.createdAt));

      return data;
    }),
  getTheCurrentJoinedSections: protectedProcedure
    .input(getManySectionsSchema)
    .query(async ({ input, ctx }) => {
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
              eq(member.role, "student"), // Filter by role
            ),
          ),
        })

        .from(organization)
        .innerJoin(
          classSubjects,
          eq(classSubjects.enrolledClass, organization.id),
        )
        .where(
          and(
            or(
              name ? ilike(organization.name, `%${name}%`) : undefined,
              slug ? ilike(organization.slug, `%${slug}%`) : undefined,
            ),
            eq(classSubjects.teacherId, ctx.auth.user.id),
          ),
        )
        .groupBy(
          organization.id,
          organization.name,
          organization.slug,
          organization.logo,
          organization.createdAt,
        )
        .orderBy(desc(organization.createdAt));

      return data;
    }),
  getCurrentSectionInfo: protectedProcedure.query(async ({ ctx }) => {
    const { id: userId } = ctx.auth.user;

    try {
      // Fix: Remove the duplicate subjectName join and fix the logic
      const result = await db
        .selectDistinct({
          id: classSubjects.id,
          enrolledClass: organization,
          subjectCode: subjects.code,
          teacher: user.name,
          role: user.role,
          status: subjects.status,
          studentCount: db.$count(
            member,
            and(
              eq(member.organizationId, classSubjects.enrolledClass),
              eq(member.role, "student"),
            ),
          ),
          subjectName: subjectName.name,
        })
        .from(classSubjects)
        .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
        .innerJoin(subjectName, eq(subjects.name, subjectName.id)) // Only join once
        .innerJoin(
          organization,
          eq(organization.id, classSubjects.enrolledClass),
        )
        .innerJoin(
          member,
          eq(member.organizationId, classSubjects.enrolledClass),
        )
        .innerJoin(user, eq(classSubjects.teacherId, user.id))
        .where(
          and(
            or(eq(subjects.status, "draft"), eq(subjects.status, "published")),
            or(eq(classSubjects.teacherId, userId), eq(member.userId, userId)),
          ),
        );

      return result;
    } catch (error) {
      console.error("Error in getAllSubjectInfo:", error);
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subject information",
      });
    }
  }),
};
