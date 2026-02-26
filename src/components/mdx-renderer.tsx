// src/components/mdx-renderer.tsx
"use client";

import { MDXClient } from "next-mdx-remote-client/csr";
import type { SerializeResult } from "next-mdx-remote-client";
import { useMDXComponents } from "./mdx-components";

interface MDXRendererProps {
  source: SerializeResult;
}

export function MDXRenderer({ source }: MDXRendererProps) {
  const components = useMDXComponents({});

  // Handle compilation errors
  if ("error" in source) {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded">
        Failed to render content: {source.error.message}
      </div>
    );
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <MDXClient {...source} components={components} />
    </div>
  );
}
