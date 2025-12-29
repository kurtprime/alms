import { inngest } from "@/services/inngest/client";
import { uploadThingMarkup } from "@/services/inngest/functions/admin";
import { serve } from "inngest/next";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [uploadThingMarkup],
});
