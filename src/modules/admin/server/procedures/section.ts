import { adminProcedure } from '@/trpc/init';
import {
  createSectionFormSchema,
  getManySectionsSchema,
  createInviteCodeSchema,
  getManyInviteCodesSchema,
  deleteInviteCodeSchema,
  getManyJoinRequestsSchema,
  processJoinRequestSchema,
} from '../adminSchema';
import { db } from '@/index';
import { member, organization, inviteCode, joinRequest, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

export const section = {
  create: adminProcedure.input(createSectionFormSchema).mutation(async ({ input }) => {
    const checkSlug = await auth.api.checkOrganizationSlug({
      body: {
        slug: input.slug, // required
      },
    });
    if (!checkSlug.status) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Organization with this slug already exists data status',
      });
    }

    await auth.api.createOrganization({
      body: {
        name: input.name,
        slug: input.slug,
      },
      headers: await headers(),
    });
  }),

  getManySections: adminProcedure.input(getManySectionsSchema).query(async ({ input }) => {
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
            eq(member.role, 'student') // Filter by role
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

  createInviteCode: adminProcedure.input(createInviteCodeSchema).mutation(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const code = nanoid(8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

    const [newCode] = await db
      .insert(inviteCode)
      .values({
        id: nanoid(),
        organizationId: input.organizationId,
        code,
        role: input.role,
        maxUses: String(input.maxUses),
        usedCount: '0',
        expiresAt,
        createdBy: session.user.id,
      })
      .returning();

    return newCode;
  }),

  getManyInviteCodes: adminProcedure.input(getManyInviteCodesSchema).query(async ({ input }) => {
    const codes = await db
      .select({
        id: inviteCode.id,
        code: inviteCode.code,
        role: inviteCode.role,
        maxUses: inviteCode.maxUses,
        usedCount: inviteCode.usedCount,
        expiresAt: inviteCode.expiresAt,
        createdAt: inviteCode.createdAt,
        creator: {
          id: user.id,
          name: user.name,
        },
      })
      .from(inviteCode)
      .innerJoin(user, eq(inviteCode.createdBy, user.id))
      .where(eq(inviteCode.organizationId, input.organizationId))
      .orderBy(desc(inviteCode.createdAt));

    return codes;
  }),

  deleteInviteCode: adminProcedure.input(deleteInviteCodeSchema).mutation(async ({ input }) => {
    await db.delete(inviteCode).where(eq(inviteCode.id, input.id));
    return { success: true };
  }),

  getManyJoinRequests: adminProcedure.input(getManyJoinRequestsSchema).query(async ({ input }) => {
    const conditions = [eq(joinRequest.organizationId, input.organizationId)];
    if (input.status) {
      conditions.push(eq(joinRequest.status, input.status));
    }

    const requests = await db
      .select({
        id: joinRequest.id,
        status: joinRequest.status,
        message: joinRequest.message,
        requestedAt: joinRequest.requestedAt,
        processedAt: joinRequest.processedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        inviteCode: {
          id: inviteCode.id,
          code: inviteCode.code,
          role: inviteCode.role,
        },
      })
      .from(joinRequest)
      .innerJoin(user, eq(joinRequest.userId, user.id))
      .innerJoin(inviteCode, eq(joinRequest.inviteCodeId, inviteCode.id))
      .where(and(...conditions))
      .orderBy(desc(joinRequest.requestedAt));

    return requests;
  }),

  processJoinRequest: adminProcedure.input(processJoinRequestSchema).mutation(async ({ input }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const [request] = await db.select().from(joinRequest).where(eq(joinRequest.id, input.id));

    if (!request) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Join request not found' });
    }

    if (request.status !== 'pending') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Request already processed' });
    }

    if (input.action === 'approve') {
      const [codeRecord] = await db
        .select()
        .from(inviteCode)
        .where(eq(inviteCode.id, request.inviteCodeId));

      if (!codeRecord) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite code not found' });
      }

      const [newMember] = await db
        .insert(member)
        .values({
          id: nanoid(),
          organizationId: request.organizationId,
          userId: request.userId,
          role: codeRecord.role as 'student' | 'teacher' | 'owner' | 'irregular' | 'advisor',
        })
        .returning();

      const code = await db
        .select()
        .from(inviteCode)
        .where(eq(inviteCode.id, request.inviteCodeId));

      if (code.length > 0) {
        const currentUsed = parseInt(code[0].usedCount, 10);
        await db
          .update(inviteCode)
          .set({ usedCount: String(currentUsed + 1) })
          .where(eq(inviteCode.id, request.inviteCodeId));
      }

      await db
        .update(joinRequest)
        .set({
          status: 'approved',
          processedBy: session.user.id,
          processedAt: new Date(),
        })
        .where(eq(joinRequest.id, input.id));

      return { success: true, member: newMember };
    } else {
      await db
        .update(joinRequest)
        .set({
          status: 'rejected',
          processedBy: session.user.id,
          processedAt: new Date(),
        })
        .where(eq(joinRequest.id, input.id));

      return { success: true };
    }
  }),
};
