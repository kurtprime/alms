import { createTRPCRouter } from "@/trpc/init";
import { sectionActions } from "./procedures/section";
import { subjectActions } from "./procedures/subject";
import { classActions } from "./procedures/class";
import { lessonActions } from "./procedures/lesson";
export const userRouter = createTRPCRouter({
  ...sectionActions,
  ...subjectActions,
  ...classActions,
  ...lessonActions,
});
