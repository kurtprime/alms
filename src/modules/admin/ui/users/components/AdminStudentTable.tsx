"use client";

import { DataTable } from "@/components/DataTable";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { studentColumns } from "./AdminStudentColumns";

export default function AdminStudentTable() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.admin.getManyStudents.queryOptions({})
  );
  return (
    <div className="md:px-14">
      <DataTable columns={studentColumns} data={data} />
    </div>
  );
}
