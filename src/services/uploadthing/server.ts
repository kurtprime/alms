"use server";

import { uploadthing } from "./client";

export async function deleteExistingFile(keys: string) {
  return await uploadthing.deleteFiles(keys);
}
