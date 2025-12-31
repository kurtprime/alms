import { relations } from "drizzle-orm";

import { user, session, account } from "./schemas/auth-schema";
import {
  organization,
  member,
  invitation,
} from "./schemas/organization-schema";
import { subjects, classSubjects, subjectName } from "./schemas/subject-schema";

// User relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(member), // User can be in multiple organizations
  invitationsSent: many(invitation, { relationName: "inviter" }),
  taughtSubjects: many(classSubjects, { relationName: "teacher" }), // Teacher for class subjects
  assignedSubjects: many(classSubjects, { relationName: "assigner" }), // Admin who assigned subjects
}));

// Session relations
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  activeOrganization: one(organization, {
    fields: [session.activeOrganizationId],
    references: [organization.id],
  }),
}));

// Account relations
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Organization relations
export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  classes: many(classSubjects, { relationName: "class" }), // Organizations acting as classes
}));

// Member relations
export const memberRelations = relations(member, ({ one }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
}));

// Invitation relations
export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
    relationName: "inviter",
  }),
}));

// Subject relations
export const subjectRelations = relations(subjects, ({ one, many }) => ({
  nameRelation: one(subjectName, {
    fields: [subjects.name],
    references: [subjectName.id],
  }),
  classInstances: many(classSubjects), // Subject can be taught in multiple classes
}));

// ClassSubject relations
export const classSubjectRelations = relations(classSubjects, ({ one }) => ({
  enrolledClass: one(organization, {
    fields: [classSubjects.enrolledClass],
    references: [organization.id],
    relationName: "class",
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
  teacher: one(user, {
    fields: [classSubjects.teacherId],
    references: [user.id],
    relationName: "teacher",
  }),
}));

// SubjectName relations
export const subjectNameRelations = relations(subjectName, ({ many }) => ({
  subjects: many(subjects), // One name can be used by multiple subject entries
}));

export * from "./schemas/auth-schema";
export * from "./schemas/organization-schema";
export * from "./schemas/subject-schema";
export * from "./schemas/lesson-schema";
export * from "./schemas/file-schema";
export * from "./schemas/activity-schema";
