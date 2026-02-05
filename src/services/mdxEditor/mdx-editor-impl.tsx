"use client";

import {
  MDXEditor,
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
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  Separator,
} from "@mdxeditor/editor";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { useUploadThing } from "../uploadthing/uploadthing";
import { Loader2 } from "lucide-react";
import { useLessonTypeParams } from "@/modules/admin/ui/subject/hooks/useSubjectSearchParamClient";
import { AddImage } from "./";
import type { MdxEditorProps } from "./index";

const toolbarContents = () => (
  <div className="w-full overflow-x-auto">
    <div className="flex items-center flex-nowrap gap-1 px-2 py-2 min-w-max">
      <UndoRedo />
      <Separator className="hidden sm:block" />
      <div className="hidden sm:flex items-center gap-1">
        <BoldItalicUnderlineToggles />
        <Separator />
      </div>
      <div className="sm:hidden">
        <BoldItalicUnderlineToggles />
      </div>
      <ListsToggle />
      <InsertThematicBreak />
      <Separator className="hidden sm:block" />
      <BlockTypeSelect />
      <CreateLink />
      <AddImage />
      <Separator className="hidden sm:block" />
      <div className="hidden lg:flex items-center gap-1">
        <InsertTable />
        <InsertCodeBlock />
      </div>
      <div className="lg:hidden">
        <InsertTable />
      </div>
    </div>
  </div>
);

export function MdxEditorImpl({ value, onChange, className }: MdxEditorProps) {
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
          "max-w-full h-full p-0",
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
