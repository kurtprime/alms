"use client";

import { DataTable } from "@/components/DataTable";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { studentColumns } from "./StudentColumns";

export default function AdminStudentTable() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.admin.getManyStudents.queryOptions({})
  );
  return <DataTable columns={studentColumns} data={data} />;
}
