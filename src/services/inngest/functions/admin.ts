import { mdxEditorImageUpload } from "@/db/schemas/file-schema";
import { db } from "@/index";
import { inngest } from "@/services/inngest/client";
import { uploadthing } from "@/services/uploadthing/client";
import { and, eq, inArray } from "drizzle-orm";

export const uploadThingMarkup = inngest.createFunction(
  { id: "uploadthing-markup-image" },
  { event: "uploadthing/markup.image.upload" },
  async ({ event, step }) => {
    const {
      data: { lessonTypeId, markup },
    } = event;

    const urlPattern = /https:\/\/utfs\.io\/f\/([a-zA-Z0-9]+)/g;

    const matches = markup.matchAll(urlPattern);
    const referencedKeys = Array.from(matches).map((match) => match[1]);

    const storedKeys = await step.run("get-image", async () => {
      const storedImages = await db
        .select({ fileKey: mdxEditorImageUpload.fileKey })
        .from(mdxEditorImageUpload)
        .where(eq(mdxEditorImageUpload.lessonTypeId, lessonTypeId));

      return storedImages.map((img) => img.fileKey);
    });
    const unusedKeys = storedKeys.filter(
      (key) => !referencedKeys.includes(key)
    );
    if (unusedKeys.length === 0) {
      return { deleted: 0, keys: [] };
    }

    await step.run("delete-unused-images", async () => {
      await uploadthing.deleteFiles(unusedKeys);

      await db
        .delete(mdxEditorImageUpload)
        .where(
          and(
            eq(mdxEditorImageUpload.lessonTypeId, lessonTypeId),
            inArray(mdxEditorImageUpload.fileKey, unusedKeys)
          )
        );
    });

    return { deleted: unusedKeys.length, keys: unusedKeys };
  }
);
