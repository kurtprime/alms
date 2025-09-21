"use client";

import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminGetStudents } from "@/modules/admin/server/adminSchema";
import { ColumnDef } from "@tanstack/react-table";

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
        <div className="flex items-center space-x-2">
          {image ? (
            <Avatar className="size-10">
              <AvatarImage src={image} alt={name} />
              <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar
              className="size-10"
              seed={name}
              variant="initials"
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold">{name}</span>
            <span className="text-sm text-muted-foreground">
              {organization?.name ?? "No Section"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "organization",
    header: "Section",
    cell: ({ row }) => {
      const { organization } = row.original;

      if (!organization) {
        return <span>No Section</span>;
      }
      const { logo, slug: strandName, name: sectionName } = organization;
      return (
        <div className="flex items-center space-x-2">
          {organization.logo != null ? (
            <Avatar className="size-10">
              <AvatarImage src={logo ?? undefined} alt={strandName} />
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
];
