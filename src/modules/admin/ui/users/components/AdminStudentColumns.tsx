"use client";

import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { separateFullName } from "@/hooks/separate-name";
import { AdminGetStudents } from "@/modules/admin/server/adminSchema";
import { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, SquareUserIcon } from "lucide-react";

export const studentColumns: ColumnDef<AdminGetStudents[number]>[] = [
  {
    accessorKey: "user",
    header: "Student Name",
    cell: ({ row }) => {
      const {
        user: { name, image },
        organization,
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
              <CornerDownRight className="size-4" />{" "}
              {organization?.slug ?? "No Section"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="border p-2 text-sm">
          <SquareUserIcon className="size-6!" /> {row.original.user?.username}
        </Badge>
      );
    },
  },
  {
    accessorKey: "activity",
    header: "Missed Activities",
    cell: () => {
      return (
        <Badge variant="destructive" className="border p-2">
          Missed Activities 5
        </Badge>
      );
    },
  },
];
