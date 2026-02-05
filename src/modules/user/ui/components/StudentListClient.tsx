"use client";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { separateFullName } from "@/hooks/separate-name";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import React from "react";

export default function StudentListClient({ classId }: { classId: string }) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.user.getAllStudentsInClass.queryOptions({
      classId,
    }),
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 w-full">
      {data.map((student) => (
        <div
          key={student.userId}
          className="flex items-center gap-3 p-4 bg-accent rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          {student.userImage ? (
            <Image
              src={student.userImage}
              width={10}
              height={10}
              alt={student.userName}
            />
          ) : (
            <GeneratedAvatar
              className="size-10 shrink-0"
              variant="initials"
              seed={separateFullName(student.userName).join(" ")}
            />
          )}
          <span className="font-medium truncate">{student.userName}</span>
        </div>
      ))}
    </div>
  );
}
