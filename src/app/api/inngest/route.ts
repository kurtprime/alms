import { inngest } from "@/services/inngest/client";
import {
  testConnection,
  uploadThingMarkup,
} from "@/services/inngest/functions/admin";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [uploadThingMarkup, testConnection],
});

//for DOCKER
// import {
//   testConnection,
//   uploadThingMarkup,
// } from "@/services/inngest/functions/admin";
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
//         functions: [handleSignupFunction, uploadThingMarkup, testConnection],
//       },
//     ],
//   });

//   console.log("Worker: connected", connection);
// })();
