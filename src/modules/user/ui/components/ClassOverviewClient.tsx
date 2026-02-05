"use client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

export default function ClassOverviewClient({ classId }: { classId: string }) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.user.getAllLessonsInClass.queryOptions({
      classId,
    }),
  );
  return <div>{JSON.stringify(data)}</div>;
}
