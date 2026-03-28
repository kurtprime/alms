import { inngest } from '@/services/inngest/client';
import { testConnection, uploadThingMarkup } from '@/services/inngest/functions/admin';
import { handleLessonPublished, handleQuizTimer } from '@/services/inngest/functions/user';
import { serve } from 'inngest/next';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [uploadThingMarkup, testConnection, handleLessonPublished, handleQuizTimer],
});

// for DOCKER
// import {
//   testConnection,
//   uploadThingMarkup,
// } from "@/services/inngest/functions/admin";
// import { handleLessonPublished } from "@/services/inngest/functions/user";
// import { Inngest } from "inngest";
// import { connect } from "inngest/connect";

// const inngest = new Inngest({
//   id: "my-app",
// });

// const handleSignupFunction = inngest.createFunction(
//   { id: "handle-signup" },
//   { event: "user.created" },
//   async ({ event, step }) => {
//     console.log("Function called", event);
//   },
// );

// (async () => {
//   const connection = await connect({
//     apps: [
//       {
//         client: inngest,
//         functions: [
//           handleSignupFunction,
//           uploadThingMarkup,
//           testConnection,
//           handleLessonPublished,
//         ],
//       },
//     ],
//   });

//   console.log("Worker: connected", connection);
// })();
