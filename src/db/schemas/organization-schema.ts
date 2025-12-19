import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const organization = pgTable("organization", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  logo: text("logo"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  metadata: text("metadata"),
});

export const organizationMemberRole = pgEnum("organization_member_role", [
  "owner",
  "teacher",
  "student",
  "irregular",
  "advisor",
]);
export type OrganizationMemberRole = typeof organizationMemberRole;
export const organizationMemberStrand = pgEnum("organization_member_strand", [
  "Not Specified",
  "Accountancy, Business and Management",
  "Humanities and Social Sciences",
  "Information and Communications Technology",
  "Home Economics",
  "Science, Technology, Engineering, and Mathematics",
]);
export type OrganizationMemberStrand = typeof organizationMemberStrand;
export const member = pgTable(
  "member",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    organizationId: varchar("organization_id", { length: 255 })
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: organizationMemberRole("role").default("owner").notNull(),
    strand: organizationMemberStrand("strand"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("member_organization_idx").on(table.organizationId),
    index("member_user_idx").on(table.userId),
    index("member_org_role_idx").on(table.organizationId, table.role),
  ]
);

export const invitation = pgTable("invitation", {
  id: varchar("id", { length: 255 }).primaryKey(),
  organizationId: varchar("organization_id", { length: 255 })
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: organizationMemberRole("role").default("owner").notNull(),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: varchar("inviter_id", { length: 255 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
