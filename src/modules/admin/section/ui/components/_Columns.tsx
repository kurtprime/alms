"use client";

import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type AdminSectionGetMany } from "@/modules/admin/server/adminSchema";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<AdminSectionGetMany[number]>[] = [
  {
    accessorKey: "name",
    header: "Course name",
    cell: ({ row }) => {
      const logo = row.original.logo;
      const strandName = row.original.name;
      const sectionName = row.original.slug;

      return (
        <div className="flex items-center space-x-2">
          {logo ? (
            <Avatar className="size-10">
              <AvatarImage src={logo} alt={strandName} />
              <AvatarFallback>{strandName}</AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar
              className="size-10"
              seed={strandName}
              variant="initials"
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold">{sectionName}</span>
            <span className="text-sm text-muted-foreground">{strandName}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Advisor Name",
    cell: () => <div>todo: advisor name</div>,
  },
  {
    accessorKey: "metadata",
    header: "Total Students",
    cell: ({ row }) => {
      return <span>{JSON.stringify(row.original.metadata) || 0}</span>;
    },
  },
];
