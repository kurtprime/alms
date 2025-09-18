"use server";

import { uploadthing } from "./client";

export async function deleteExistingFile(keys: string) {
  await uploadthing.deleteFiles(keys);
}
