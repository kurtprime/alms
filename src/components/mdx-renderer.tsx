// src/components/mdx-renderer.tsx (Client Component)
"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define your custom components
const components = {
  Button,
  Alert,
  AlertDescription,
  // Add more components as needed
};

interface MDXRendererProps {
  source: MDXRemoteSerializeResult;
}

export function MDXRenderer({ source }: MDXRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <MDXRemote {...source} components={components} />
    </div>
  );
}
