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
    <div className="absolute ml-5 md:ml-100">
      <AddLessonBtn classId={classId} />
    </div>
  );
}
