"use client";

import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { separateFullName } from "@/hooks/separate-name";
import { AdminGetStudents } from "@/modules/admin/server/adminSchema";
import { ColumnDef } from "@tanstack/react-table";
import { CornerDownRight, Ellipsis, SquareUserIcon } from "lucide-react";
import AdminUpdateStudents from "./AdminUpdateStudents";
import React from "react";
import ResponsiveDialog from "@/components/responsive-dialog";

export const studentColumns: ColumnDef<AdminGetStudents[number]>[] = [
  {
    accessorKey: "user",
    header: "Student Name",
    cell: ({ row }) => {
      const {
        user: { name, image, customId },
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
              <CornerDownRight className="size-4" /> {customId}
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
    accessorKey: "member.strand",
    header: "Strand",
    cell: ({ row }) => {
      const { member } = row.original;
      function getInitials(str: string) {
        // Return "Not Specified" unchanged
        if (str === "Not Specified") {
          return str;
        }
        if (str === "Humanities and Social Sciences") return "HUMSS";
        return (
          str
            .split(" ") // Split into words
            .map((word) => word.replace(/[^a-zA-Z]/g, "")) // Remove punctuation
            .filter((word) => word && word.toLowerCase() !== "and") // Remove empty and "and"
            .map((word) => word.charAt(0).toUpperCase()) // Get first letter
            .join(".") + "."
        ); // Join with periods and add trailing period
      }
      return (
        <h2 className="font-semibold">
          {member ? getInitials(`${member.strand}`) : "Not Specified"}
        </h2>
      );
    },
  },
  {
    accessorKey: "section",
    header: "Section",
    cell: ({ row }) => {
      const { organization } = row.original;
      return (
        <h2 className="font-semibold">
          {" "}
          {organization ? organization.slug : "No Section"}
        </h2>
      );
    },
  },
  {
    accessorKey: "action",
    header: "",
    cell: ({ row }) => {
      return <ActionColumn row={row.original.user.id} />;
    },
  },
];

function ActionColumn({ row }: { row: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="p-1 rounded-full">
            <Ellipsis className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              Edit Students
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResponsiveDialog
        onOpenChange={setOpen}
        open={open}
        title="Update Student"
        description=""
      >
        <AdminUpdateStudents setOpen={setOpen} userId={row} />
      </ResponsiveDialog>
    </>
  );
}
