import fs from "fs";
import path from "path";
import { serializeMDX } from "./mdx";

const CONTENT_DIR = path.join(process.cwd(), "content");

export async function getMDXFile(slug: string) {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const serialized = await serializeMDX(content);

  return serialized;
}
