"use client";

import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { separateFullName } from "@/hooks/separate-name";
import { AdminGetTeachers } from "@/modules/admin/server/adminSchema";
import { ColumnDef } from "@tanstack/react-table";
import { SquareUserIcon } from "lucide-react";

export const teacherColumns: ColumnDef<AdminGetTeachers[number]>[] = [
  {
    accessorKey: "user",
    header: "Student Name",
    cell: ({ row }) => {
      const {
        user: { name, image },
      } = row.original;

      return (
        <div className="flex items-center space-x-2 md:p-3">
          {image ? (
            <Avatar className="size-10">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar
              className="size-10"
              seed={separateFullName(name).join(" ")}
              variant="initials"
            />
          )}
          <div className="flex flex-col">
            <span className="text-lg font-semibold">{name}</span>
            <span className="text-sm flex text-muted-foreground">
              <SquareUserIcon className="size-6!" />{" "}
              {row.original.user?.username}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "totalSections",
    header: "Total Sections",
    cell: () => {
      return (
        <Badge variant="outline" className="border p-2 text-sm">
          Total Sections: 13
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalSubjects",
    header: "Total Subjects",
    cell: () => {
      return (
        <Badge variant="secondary" className="border p-2">
          Subjects handled: Science, Math, English
        </Badge>
      );
    },
  },
];
