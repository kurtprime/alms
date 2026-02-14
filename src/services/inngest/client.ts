import { updateMarkUp } from "@/modules/admin/server/adminSchema";
import { EventSchemas, Inngest } from "inngest";
import z from "zod";

type InngestEvents = {
  "uploadthing/markup.image.upload": {
    data: z.infer<typeof updateMarkUp>;
  };
  "test/connection": {
    data: undefined;
  };
};

export const inngest = new Inngest({
  id: "learning-management-system",
  // eventKey: process.env.INNGEST_EVENT_KEY, // Your generated event key
  // signingKey: process.env.INNGEST_SIGNING_KEY,
  schemas: new EventSchemas().fromRecord<InngestEvents>(),
});
