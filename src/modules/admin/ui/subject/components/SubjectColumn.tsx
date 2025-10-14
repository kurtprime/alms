"use client";

import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AdminGetAllClassPerSubject } from "@/modules/admin/server/adminSchema";
import { ColumnDef } from "@tanstack/react-table";
import {
  FilePenLineIcon,
  Hash,
  Upload,
  Users2,
  UserSquare2Icon,
} from "lucide-react";

export const subjectColumn: ColumnDef<AdminGetAllClassPerSubject[number]>[] = [
  {
    accessorKey: "subjectCode",
    header: "Subject Code",
    cell: ({ row }) => {
      const { subjectCode } = row.original;

      return (
        <Badge variant="outline" className="min-w-20 h-6 bg-accent">
          <Hash className="size-5 " /> {subjectCode}
        </Badge>
      );
    },
  },
  {
    accessorKey: "enrolledClass",
    header: "Class",
    cell: ({ row }) => {
      const {
        enrolledClass: { id, name, slug, logo },
      } = row.original;

      return (
        <div className="flex items-center space-x-2">
          {logo ? (
            <Avatar className="size-10">
              <AvatarImage src={logo} alt={name} />
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar
              className="size-10"
              seed={name}
              id={id}
              variant="initials"
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold">{slug}</span>
            <span className="text-sm text-muted-foreground">{name}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "teacher",
    header: "Teacher",
    cell: ({ row }) => {
      const { teacher } = row.original;

      return (
        <h2 className="flex font-semibold gap-2">
          <UserSquare2Icon /> {teacher}
        </h2>
      );
    },
  },
  {
    accessorKey: "studentCount",
    header: "Student Count",
    cell: ({ row }) => {
      const { studentCount } = row.original;

      return (
        <h2 className="flex font-semibold gap-2">
          <Users2 /> {studentCount}
        </h2>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status } = row.original;

      if (status === "draft")
        return (
          <Badge
            variant="destructive"
            className="flex font-semibold min-w-25 shadow gap-2 px-2 py-1"
          >
            <FilePenLineIcon /> {status}
          </Badge>
        );

      if (status === "published") {
        return (
          <Badge
            variant="outline"
            className="flex font-semibold min-w-25 shadow gap-2 px-2 py-1"
          >
            <Upload /> {status}
          </Badge>
        );
      }
    },
  },
];
