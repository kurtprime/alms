"use client";

import { DataTable } from "@/components/DataTable";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { teacherColumns } from "./AdminTeacherColumns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminTeacherTable() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.admin.getManyTeachers.queryOptions({})
  );
  return (
    <div className="md:px-14">
      <DataTable columns={teacherColumns} data={data} />;
    </div>
  );
}
