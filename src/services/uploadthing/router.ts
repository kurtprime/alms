import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentUser } from "@/lib/auth";

const f = createUploadthing();

export const customFileRouter = {
  sectionImageUploader: f(
    {
      image: {
        maxFileSize: "4MB",
      },
    },
    { awaitServerData: true }
  )
    .middleware(async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser?.user?.id)
        throw new UploadThingError("Unauthorize user");

      const userId = currentUser.user.id;

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId };
    })
    .onUploadComplete(async () => {
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

      return { message: "Resume uploaded Successfully" };
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
