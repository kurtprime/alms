import { Session } from "@/lib/auth-client";
import React from "react";
import AddLessonBtn from "./AddLesson";

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
