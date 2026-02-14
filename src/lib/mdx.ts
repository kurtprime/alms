import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

export async function serializeMDX(
  content: string,
): Promise<MDXRemoteSerializeResult> {
  // Handle empty content gracefully
  if (!content?.trim()) {
    return serialize("", { parseFrontmatter: true });
  }

  const serialized = await serialize(content, {
    parseFrontmatter: true,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypeHighlight],
    },
  });

  return serialized;
}
