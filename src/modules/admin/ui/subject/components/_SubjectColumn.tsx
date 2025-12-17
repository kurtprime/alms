"use client";

import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGetAllClassPerSubjectId } from "@/modules/admin/server/adminSchema";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArchiveIcon,
  Edit,
  EllipsisIcon,
  FilePenLineIcon,
  Hash,
  Upload,
  Users2,
  UserSquare2Icon,
} from "lucide-react";

const BadgeSkeleton = () => (
  <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-gray-100">
    <Skeleton className="w-4 h-4 rounded-full" />
    <Skeleton className="w-16 h-4 rounded-full" />
  </div>
);

// Skeleton for Avatar with two lines of text
const AvatarWithTextSkeleton = () => (
  <div className="flex items-center space-x-2">
    <Skeleton className="size-10 rounded-full" />
    <div className="flex flex-col space-y-1">
      <Skeleton className="w-24 h-4 rounded" />
      <Skeleton className="w-32 h-3 rounded" />
    </div>
  </div>
);

// Skeleton for Icon + Text
const IconTextSkeleton = ({ width = "w-24" }: { width?: string }) => (
  <div className="flex items-center gap-2 font-semibold">
    <Skeleton className="w-5 h-5 rounded" />
    <Skeleton className={`${width} h-4 rounded`} />
  </div>
);

// Skeleton for Action Button
const ActionButtonSkeleton = () => (
  <Skeleton className="h-5 w-10 rounded-2xl" />
);

const SubjectCodeCell = ({ id }: { id: string }) => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectInfo.queryOptions({
      id: id,
    })
  );

  if (isLoading) return <BadgeSkeleton />;
  if (!data) return <div>no data</div>;

  return (
    <Badge variant="outline" className="min-w-20 h-6 bg-accent">
      <Hash className="size-5 " /> {data.subjectCode}
    </Badge>
  );
};

const ClassCell = ({ classId }: { classId: string }) => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectInfo.queryOptions({
      id: classId,
    })
  );

  if (isLoading) return <AvatarWithTextSkeleton />;
  if (!data) return <div>no data</div>;

  const {
    enrolledClass: { id, name, slug, logo },
  } = data;

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
};

const TeacherCell = ({ classId }: { classId: string }) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectInfo.queryOptions({
      id: classId,
    })
  );

  if (isLoading) return <IconTextSkeleton width="w-32" />;
  if (!data) return <div>no data</div>;

  const { teacher } = data;

  return (
    <h2 className="flex font-semibold gap-2">
      <UserSquare2Icon /> {teacher}
    </h2>
  );
};

const StudentCountCell = ({ classId }: { classId: string }) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectInfo.queryOptions({
      id: classId,
    })
  );
  if (isLoading) return <IconTextSkeleton width="w-12" />;
  if (!data) return <div>no data</div>;

  const { studentCount } = data;

  return (
    <h2 className="flex font-semibold gap-2">
      <Users2 /> {studentCount}
    </h2>
  );
};

const StatusCell = ({ classId }: { classId: string }) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectInfo.queryOptions({
      id: classId,
    })
  );
  if (isLoading) return <BadgeSkeleton />;
  if (!data) return <div>no data</div>;

  const { status } = data;

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
};

const IdCell = ({ classId }: { classId: string }) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectInfo.queryOptions({
      id: classId,
    })
  );

  if (isLoading) return <ActionButtonSkeleton />;
  if (!data) return <div>no data</div>;

  const { id } = data;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="p-0 h-5 w-10 rounded-2xl">
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Menu</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            console.log(id);
          }}
        >
          <Edit /> edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            console.log("archived");
          }}
        >
          <ArchiveIcon /> archived
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const SubjectColumn: ColumnDef<AdminGetAllClassPerSubjectId[number]>[] =
  [
    {
      accessorKey: "subjectCode",
      header: "Subject Code",
      cell: ({ row }) => {
        return <SubjectCodeCell id={row.original.classSubjectId} />;
      },
    },
    {
      accessorKey: "enrolledClass",
      header: "Class",
      cell: ({ row }) => {
        return <ClassCell classId={row.original.classSubjectId} />;
      },
    },
    {
      accessorKey: "teacher",
      header: "Teacher",
      cell: ({ row }) => {
        return <TeacherCell classId={row.original.classSubjectId} />;
      },
    },
    {
      accessorKey: "studentCount",
      header: "Student Count",
      cell: ({ row }) => {
        return <StudentCountCell classId={row.original.classSubjectId} />;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return <StatusCell classId={row.original.classSubjectId} />;
      },
    },
    {
      accessorKey: "id",
      header: "",
      cell: ({ row }) => {
        return <IdCell classId={row.original.classSubjectId} />;
      },
    },
  ];
