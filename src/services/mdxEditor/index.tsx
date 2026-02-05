import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const MdxEditor = dynamic(
  () => import("./mdx-editor-impl").then((mod) => mod.MdxEditorImpl),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full" />,
  },
);
export const AddImage = dynamic(
  () => import("./custom-image-dialog").then((mod) => mod.CustomAddImage),
  { ssr: false },
);

export interface MdxEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
