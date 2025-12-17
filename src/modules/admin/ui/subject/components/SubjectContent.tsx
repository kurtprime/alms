import { DataTable } from "@/components/DataTable";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useRouter } from "next/navigation";
import { SubjectColumn } from "./_SubjectColumn";

type Props = {
  subjectId: number;
  subjectCount: number;
};

export default function SubjectContent({ subjectId, subjectCount }: Props) {
  const trpc = useTRPC();
  const router = useRouter();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectIdPerClass.queryOptions({ subjectId })
  );

  return (
    <DataTable
      className="bg-transparent border-none"
      tableRowClassName="hover:bg-accent/40"
      columns={SubjectColumn}
      data={data ?? []}
      loading={isLoading}
      skeletonRows={subjectCount}
      onRowClick={(row) => router.push(`/admin/subjects/${row.classSubjectId}`)}
    />
  );
}
