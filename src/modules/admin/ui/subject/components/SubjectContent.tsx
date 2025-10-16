import { DataTable } from "@/components/DataTable";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { subjectColumn } from "./SubjectColumn";
import { useRouter } from "next/navigation";

type Props = {
  subjectId: string;
};

export default function SubjectContent({ subjectId }: Props) {
  const trpc = useTRPC();
  const router = useRouter();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectsPerClass.queryOptions({ subjectId })
  );

  if (isLoading) {
    return <div>loading</div>;
  }
  if (!data) {
    return <div>no Data</div>;
  }

  return (
    <DataTable
      className="bg-transparent border-none"
      tableRowClassName="hover:bg-accent/40"
      columns={subjectColumn}
      data={data}
      onRowClick={(row) => router.push(`/admin/subjects/${row.id}`)}
    />
  );
}
