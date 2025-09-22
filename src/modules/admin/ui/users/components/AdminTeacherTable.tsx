"use client";

import { DataTable } from "@/components/DataTable";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { studentColumns } from "./AdminStudentColumns";
import { teacherColumns } from "./AdminTeacherColumns";

export default function AdminTeacherTable() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.admin.getManyTeachers.queryOptions({})
  );
  return <DataTable columns={teacherColumns} data={data} />;
}
