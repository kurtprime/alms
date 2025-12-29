// components/mdx-editor.tsx
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MDXEditor = dynamic(
  () => import("@mdxeditor/editor").then((mod) => mod.MDXEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full" />,
  }
);

import {
  // Core plugins
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  thematicBreakPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  imagePlugin,
  toolbarPlugin,

  // ✅ ALL EXPORTED & COMPATIBLE toolbar items
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  Separator,
} from "@mdxeditor/editor";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MDXEditor as useMDXEditor } from "@mdxeditor/editor";
import { useCallback } from "react";
import { useUploadThing } from "../uploadthing/uploadthing";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLessonTypeParams } from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamClient";
import { AddImage } from "./custom-image-dialog";

const toolbarContents = () => (
  <div className="w-full overflow-x-auto">
    <div className="flex items-center flex-nowrap gap-1 px-2 py-2 min-w-max">
      {/* Undo/Redo */}
      <UndoRedo />

      <Separator className="hidden sm:block" />

      {/* Text & Block Types - Hide some on mobile */}
      <div className="hidden sm:flex items-center gap-1">
        <BoldItalicUnderlineToggles />
        <Separator />
      </div>

      {/* Mobile: Show essentials only */}
      <div className="sm:hidden">
        <BoldItalicUnderlineToggles />
      </div>

      {/* Lists & Blocks */}
      <ListsToggle />
      <InsertThematicBreak />

      <Separator className="hidden sm:block" />

      {/* Links & Media */}
      <BlockTypeSelect />

      <CreateLink />
      {/* <InsertImage /> */}
      <AddImage />

      <Separator className="hidden sm:block" />

      {/* Advanced Insertions - Hide on mobile */}
      <div className="hidden lg:flex items-center gap-1">
        <InsertTable />
        <InsertCodeBlock />
      </div>

      {/* Mobile: Show minimal version */}
      <div className="lg:hidden">
        <InsertTable />
      </div>
    </div>
  </div>
);

interface MdxEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MdxEditor({ value, onChange, className }: MdxEditorProps) {
  const isMobile = useIsMobile();
  const [lessonTypeParams] = useLessonTypeParams();

  const { startUpload } = useUploadThing("mdxImageUploader");
  const [uploadingImage, setUploadingImage] = useState(false);

  return (
    <div className="relative">
      {uploadingImage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <MDXEditor
        className={cn(
          "mdxeditor-custom",
          "prose prose-sm sm:prose-base dark:prose-invert",
          "max-w-full h-full p-0"
        )}
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
          codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
          imagePlugin({
            imageUploadHandler: async (image) => {
              setUploadingImage(true);
              try {
                const uploadedFiles = await startUpload([image], {
                  lessonTypeId: lessonTypeParams.id,
                });
                if (!uploadedFiles || uploadedFiles.length === 0) {
                  throw new Error("Upload failed");
                }
                return uploadedFiles[0].ufsUrl;
              } finally {
                setUploadingImage(false);
              }
            },
          }),
          toolbarPlugin({ toolbarContents }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: "JavaScript",
              css: "CSS",
              txt: "Text",
              ts: "TypeScript",
            },
          }),
        ]}
      />
    </div>
  );
}
