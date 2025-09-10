import { createTRPCRouter } from "@/trpc/init";
import { section } from "./procedures/section";

export const adminRouter = createTRPCRouter({
  ...section,
});
