import { UTApi } from "uploadthing/server";

export const uploadthing = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});
