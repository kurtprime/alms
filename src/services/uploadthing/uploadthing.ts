import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import { CustomFileRouter } from "./router";

export const UploadButton = generateUploadButton<CustomFileRouter>();
export const UploadDropzone = generateUploadDropzone<CustomFileRouter>();
