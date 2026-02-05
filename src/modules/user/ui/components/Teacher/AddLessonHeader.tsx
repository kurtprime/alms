import { Session } from "@/lib/auth-client";
import { getCurrentUser } from "@/lib/auth-server";
import React from "react";
import AddLessonBtn from "./AddLessonBtn";

export default async function AddLessonHeader({
  classId,
  session,
}: {
  classId: string;
  session: Session;
}) {
  const isTeacher = session.user.role === "teacher";
  if (!isTeacher) return null;
  return (
    <div className="w-full flex justify-center ">
      <AddLessonBtn classId={classId} />
    </div>
  );
}
