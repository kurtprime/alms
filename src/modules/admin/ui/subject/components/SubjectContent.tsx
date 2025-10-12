import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import React from "react";

type Props = {
  subjectId: string;
};

export default function SubjectContent({ subjectId }: Props) {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectsPerClass.queryOptions({ subjectId })
  );

  return <div>{isLoading ? <p>TODO: Loading</p> : JSON.stringify(data)}</div>;
}
