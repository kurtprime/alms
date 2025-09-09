import { adminRouter } from "@/modules/admin/server/procedure";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  admin: adminRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
