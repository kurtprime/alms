// components/mdx-editor.tsx
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import MDXEditor to avoid SSR issues
const MDXEditor = dynamic(
  () => import("@mdxeditor/editor").then((mod) => mod.MDXEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full" />,
  }
);

// Import the necessary plugins
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  thematicBreakPlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  imagePlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  InsertTable,
  InsertImage,
  CreateLink,
  InsertCodeBlock,
  DiffSourceToggleWrapper,
} from "@mdxeditor/editor";

// Create a custom toolbar
const toolbarContents = () => (
  <>
    <DiffSourceToggleWrapper>
      <UndoRedo />
      <BoldItalicUnderlineToggles />
      <CreateLink />
      <InsertImage />
      <InsertTable />
      <InsertCodeBlock />
    </DiffSourceToggleWrapper>
  </>
);

interface MdxEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MdxEditor({ value, onChange, className }: MdxEditorProps) {
  return (
    <div className={className}>
      <MDXEditor
        markdown={value}
        onChange={onChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          frontmatterPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "tsx" }),
          imagePlugin({
            imageUploadHandler: async (image) => {
              // Implement your image upload logic here
              return URL.createObjectURL(image);
            },
          }),
          diffSourcePlugin(),
          toolbarPlugin({ toolbarContents }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: "JavaScript",
              css: "CSS",
              txt: "Text",
              tsx: "TypeScript",
              ts: "TypeScript",
            },
          }),
        ]}
      />
    </div>
  );
}
