import { z } from "zod";

export const createAdminSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50),
});
