import { AdminGetAllClassPerSubject } from "@/modules/admin/server/adminSchema";
import { ColumnDef } from "@tanstack/react-table";

export const subjectColumn: ColumnDef<AdminGetAllClassPerSubject>[] = [
  {
    accessorKey: "teacher",
  },
];
