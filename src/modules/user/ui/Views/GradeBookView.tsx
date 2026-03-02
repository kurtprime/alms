"use client";
import { Session } from "@/lib/auth-client";
import { GradebookDataTable } from "../components/Teacher/GradebookDataTable";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { AssessmentColumn, StudentGradeRow } from "../../server/userSchema";

export default function GradeBookView({
  classId,
  session,
}: {
  classId: string;
  session: Session;
}) {
  const trpc = useTRPC();

  const { data: gradeData, isPending } = useQuery(
    trpc.user.getGradebookData.queryOptions({
      classId,
    }),
  );

  const isTeacher = session.user.role === "teacher";

  if (isPending) return <div>loading</div>;
  if (!gradeData) return <div>No data</div>;

  const rows = gradeData.rows;

  const assessments: AssessmentColumn[] = gradeData.assessments;

  const data = { assessments, rows };

  return (
    <GradebookDataTable data={data} classId={classId} isTeacher={isTeacher} />
  );
}
