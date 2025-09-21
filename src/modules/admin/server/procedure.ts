import { createTRPCRouter } from "@/trpc/init";
import { section } from "./procedures/section";
import { users } from "./procedures/users";
export const adminRouter = createTRPCRouter({
  ...section,
  ...users,
});
