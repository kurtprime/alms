import { updateMarkUp } from "@/modules/admin/server/adminSchema";
import { EventSchemas, Inngest } from "inngest";
import z from "zod";

type InngestEvents = {
  "uploadthing/markup.image.upload": {
    data: z.infer<typeof updateMarkUp>;
  };
};

export const inngest = new Inngest({
  id: "learning-management-system",
  schemas: new EventSchemas().fromRecord<InngestEvents>(),
});
