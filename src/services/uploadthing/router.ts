import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import z from 'zod';
import { db } from '@/index';
import {
  assignmentDocument,
  lessonDocument,
  mdxEditorImageUpload,
  quizAttempt,
  user,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-server';
import { eq } from 'drizzle-orm';

const f = createUploadthing();

const fileTypes = {
  pdf: { maxFileSize: '4MB', maxFileCount: 10 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    maxFileSize: '8MB',
    maxFileCount: 10, // .docx files
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    maxFileSize: '16MB', // .pptx files
    maxFileCount: 10,
  },
  'application/msword': {
    maxFileSize: '8MB', // .doc files (older Word format)
    maxFileCount: 10,
  },
  'application/vnd.ms-powerpoint': {
    maxFileSize: '16MB', // .ppt files (older PowerPoint format)
    maxFileCount: 10,
  },
} as const;

// Valid file types for Assignments (Documents, Images, Archives)
const assignmentFileTypes = {
  'application/pdf': { maxFileSize: '16MB', maxFileCount: 5 },
  'image/png': { maxFileSize: '8MB', maxFileCount: 5 },
  'image/jpeg': { maxFileSize: '8MB', maxFileCount: 5 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    maxFileSize: '8MB',
    maxFileCount: 5,
  }, // docx
  'application/msword': { maxFileSize: '8MB', maxFileCount: 5 }, // doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    maxFileSize: '16MB',
    maxFileCount: 5,
  }, // pptx
  'application/vnd.ms-powerpoint': { maxFileSize: '16MB', maxFileCount: 5 }, // ppt
  'application/zip': { maxFileSize: '32MB', maxFileCount: 1 }, // For multiple files compressed
  'application/x-zip-compressed': { maxFileSize: '32MB', maxFileCount: 1 },
} as const;

export type AssignmentMimeType = keyof typeof assignmentFileTypes;

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

      if (!currentUser?.user?.id) throw new UploadThingError('Unauthorize user');

      const userId = currentUser.user.id;

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId, lessonId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
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

      return { message: 'File uploaded Successfully' };
    }),
  mdxImageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .input(z.object({ lessonTypeId: z.int() }))
    .middleware(async ({ input }) => {
      await getCurrentUser();

      return { lessonTypeId: input.lessonTypeId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { key, ufsUrl } = file;
      console.log('inserting ' + metadata.lessonTypeId);
      await db.insert(mdxEditorImageUpload).values({
        lessonTypeId: metadata.lessonTypeId,
        fileKey: key,
        fileUrl: ufsUrl,
      });
      console.log('SUCCESS');

      return {
        success: true,
        key: file.key,
        url: ufsUrl,
        name: file.name,
      };
    }),

  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const currentUser = await getCurrentUser();

      if (!currentUser?.user?.id) {
        throw new UploadThingError('Unauthorized');
      }

      return { userId: currentUser.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update the user's image URL in the database
      await db
        .update(user)
        .set({
          image: file.ufsUrl,
          updatedAt: new Date(),
        })
        .where(eq(user.id, metadata.userId));

      return { uploadedBy: metadata.userId };
    }),
  profileImage: f({
    image: {
      maxFileSize: '1MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { user } = await getCurrentUser();
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Profile image uploaded:', file.url);
      return { url: file.url };
    }),

  assignmentSubmissionUploader: f(assignmentFileTypes)
    .input(
      z.object({
        lessonTypeId: z.number(),
        quizId: z.number(),
        attemptNumber: z.number(),
      })
    )
    .middleware(async ({ input }) => {
      const currentUser = await getCurrentUser();

      if (!currentUser?.user?.id) {
        throw new UploadThingError('Unauthorized user');
      }

      const userId = currentUser.user.id;
      const { quizId, attemptNumber } = input;

      // 1. Create the Quiz Attempt ONCE for this batch upload
      // We use onConflictDoNothing or a check to prevent duplicates if retrying
      // But here we assume attemptNumber is calculated correctly client-side or we create a new one.

      // Simple approach: Insert new attempt for this batch
      const [newAttempt] = await db
        .insert(quizAttempt)
        .values({
          quizId: quizId,
          studentId: userId,
          attemptNumber: attemptNumber,
          startedAt: new Date(),
          submittedAt: new Date(), // Mark as submitted immediately on upload start
          status: 'submitted',
        })
        .returning({ id: quizAttempt.id });

      if (!newAttempt) {
        throw new UploadThingError('Failed to create attempt');
      }

      return {
        userId,
        lessonTypeId: input.lessonTypeId,
        quizAttemptId: newAttempt.id, // Pass the ID to onUploadComplete
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { name, ufsUrl, key, size, url, type } = file;

      // 2. Link the file to the Attempt ID created in middleware
      await db.insert(assignmentDocument).values({
        quizAttemptId: metadata.quizAttemptId, // Use the ID from middleware
        name: name,
        fileHash: file.fileHash,
        size: size,
        fileKey: key,
        fileUrl: url,
        fileUfsUrl: ufsUrl,
        fileType: type,
      });

      return { message: 'File linked to attempt successfully' };
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
