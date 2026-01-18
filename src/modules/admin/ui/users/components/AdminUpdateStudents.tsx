import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { AdminCreateStudentForm } from "./AdminCreateStudent";
import { separateFullName } from "@/hooks/separate-name";

export default function AdminUpdateStudents({
  userId,
  setOpen,
}: {
  userId: string;
  setOpen: (open: boolean) => void;
}) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.admin.getManyStudents.queryOptions({ userId: userId })
  );
  if (isLoading) {
    return <SkeletonLoadingUpdateStudentForm />;
  }
  if (!data || data.length === 0) {
    return <div>No student found {userId}</div>;
  }
  const firstData = data[0];
  const firstName = separateFullName(firstData.user.name)[0];
  const lastName = separateFullName(firstData.user.name)[1];
  const studentInfo = {
    id: firstData.user.id,
    firstName: firstName,
    lastName: lastName,
    middleInitial: firstData.user.middleInitial || "",
    userId: firstData.user.customId || "",
    organizationId: firstData.organization?.id || "",
    strand: firstData.member?.strand || "Not Specified",
  };
  return (
    <AdminCreateStudentForm
      recentStrand={studentInfo?.strand}
      setOpen={setOpen}
      recentSections={studentInfo?.organizationId || "Not Specified"}
      studentInfo={studentInfo}
    />
  );
}

function SkeletonLoadingUpdateStudentForm() {
  return (
    <div className="flex flex-col bg-background space-y-4">
      {/* First Row - 2 Columns */}
      <div className="grid gap-4 py-4 md:grid-cols-2">
        {/* First Name Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>

        {/* Middle Initial Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      </div>

      {/* Second Row - 2 Columns */}
      <div className="grid gap-4 pb-4 md:grid-cols-2">
        {/* Last Name Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>

        {/* Student ID Field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      </div>

      {/* Strand Select - Full Width */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Select Trigger */}
      </div>

      {/* Section Search - Full Width */}
      <div className="space-y-2 my-4">
        <Skeleton className="h-4 w-24" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Command Input */}
      </div>
    </div>
  );
}
