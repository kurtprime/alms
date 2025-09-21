import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  setUser: ["create", "update", "delete"], // <-- Permissions available for created roles
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  user: [],
  setUser: [],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  setUser: ["create", "update", "delete"],
});

export const teacher = ac.newRole({
  setUser: ["create", "update"],
});

export const student = ac.newRole({
  setUser: ["update"],
});
