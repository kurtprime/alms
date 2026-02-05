import { TRPCReactProvider } from "@/trpc/client";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
