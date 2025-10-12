import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-max flex-1 my-4 md:mr-4 border bg-muted rounded-2xl flex flex-col gap-1">
      {children}
    </div>
  );
}
