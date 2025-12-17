import { createTRPCRouter } from "@/trpc/init";
import { section } from "./procedures/section";
import { users } from "./procedures/users";
import { subjectActions } from "./procedures/subject";
import { lessonActions } from "./procedures/lesson";
export const adminRouter = createTRPCRouter({
  ...section,
  ...users,
  ...subjectActions,
  ...lessonActions,
});
