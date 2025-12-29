import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentUser } from "@/lib/auth";
import z from "zod";
import { db } from "@/index";
import { lessonDocument, mdxEditorImageUpload } from "@/db/schema";

const f = createUploadthing();

const fileTypes = {
  pdf: { maxFileSize: "4MB", maxFileCount: 10 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    maxFileSize: "8MB",
    maxFileCount: 10, // .docx files
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    maxFileSize: "16MB", // .pptx files
    maxFileCount: 10,
  },
  "application/msword": {
    maxFileSize: "8MB", // .doc files (older Word format)
    maxFileCount: 10,
  },
  "application/vnd.ms-powerpoint": {
    maxFileSize: "16MB", // .ppt files (older PowerPoint format)
    maxFileCount: 10,
  },
} as const;

export const customFileRouter = {
  documentLessonUploader: f(fileTypes)
    .input(
      z.object({
        lessonId: z.int(),
      })
    )
    .middleware(async ({ input, files }) => {
      const { lessonId } = input;
      const currentUser = await getCurrentUser();

      if (!currentUser?.user?.id)
        throw new UploadThingError("Unauthorize user");

      const userId = currentUser.user.id;
      console.log("FILES ", files);

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId, lessonId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("FILE INFORMATION: ", file);
      console.log(
        "metadata INFORMATION: ",
        metadata as {
          userId: string;
        }
      );
      const { name, ufsUrl, key, size, fileHash, url, type } = file;

      await db.insert(lessonDocument).values({
        lessonTypeId: metadata.lessonId,
        name,
        fileHash,
        size,
        fileKey: key,
        fileUrl: url,
        fileUfsUrl: ufsUrl,
        fileType: type,
      });

      // { metadata, file }
      // const { userId } = metadata;
      // const resumeFileKey = await getUserResumeFileKey(userId);

      // await upsertUserResume(userId, {
      //   resumeFileUrl: file.ufsUrl,
      //   resumeFileKey: file.key,
      // });

      // if (resumeFileKey != null) {
      //   await uploadthing.deleteFiles(resumeFileKey);
      // }

      // await inngest.send({
      //   name: "app/resume.uploaded",
      //   user: {
      //     id: userId,
      //   },
      // });

      return { message: "File uploaded Successfully" };
    }),
  mdxImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 20,
    },
  })
    .input(z.object({ lessonTypeId: z.int() }))
    .middleware(async ({ input }) => {
      const user = await getCurrentUser();
      if (user.session == undefined)
        throw new UploadThingError({
          message: "not currently login",
          code: "FORBIDDEN",
        });
      return { lessonTypeId: input.lessonTypeId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Store in database with userId for tracking
      const { key, ufsUrl } = file;
      await db.insert(mdxEditorImageUpload).values({
        lessonTypeId: metadata.lessonTypeId,
        fileKey: key,
        fileUrl: ufsUrl,
      });

      return {
        success: true,
        key: file.key,
        url: file.ufsUrl,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type CustomFileRouter = typeof customFileRouter;

// async function getUserResumeFileKey(userId: string) {
//   const data = await db.query.UserResumeTable.findFirst({
//     where: eq(UserResumeTable.userId, userId),
//     columns: {
//       resumeFileKey: true,
//     },
//   });

//   return data?.resumeFileKey;
// }
