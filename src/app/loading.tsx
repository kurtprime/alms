import { Spinner } from "@/components/ui/spinner";
import React from "react";

export default function loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner className="size-10" />
    </div>
  );
}
