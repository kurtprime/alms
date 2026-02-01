import { adminRouter } from "@/modules/admin/server/procedure";
import { createTRPCRouter } from "../init";
import { userRouter } from "@/modules/user/server/procedure";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
  user: userRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
