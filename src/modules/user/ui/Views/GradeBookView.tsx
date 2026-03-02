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

  if (isPending) return <div>loading</div>;
  if (!gradeData) return <div>No data</div>;

  // const assessments: AssessmentColumn[] = [
  //   {
  //     id: 1,
  //     title: "Quiz 1",
  //     maxScore: 100,
  //     type: "quiz" as "quiz" | "assignment",
  //   },
  //   {
  //     id: 2,
  //     title: "Quiz 2",
  //     maxScore: 100,
  //     type: "quiz" as "quiz" | "assignment",
  //   },
  //   {
  //     id: 3,
  //     title: "Quiz 3",
  //     maxScore: 100,
  //     type: "quiz" as "quiz" | "assignment",
  //   },
  //   {
  //     id: 4,
  //     title: "Quiz 4",
  //     maxScore: 100,
  //     type: "quiz" as "quiz" | "assignment",
  //   },
  //   {
  //     id: 5,
  //     title: "Quiz 4",
  //     maxScore: 100,
  //     type: "assignment" as "quiz" | "assignment",
  //   },
  //   {
  //     id: 6,
  //     title: "Quiz 4",
  //     maxScore: 100,
  //     type: "assignment" as "quiz" | "assignment",
  //   },
  //   {
  //     id: 7,
  //     title: "Quiz 4",
  //     maxScore: 100,
  //     type: "assignment" as "quiz" | "assignment",
  //   },
  //   {
  //     id: 8,
  //     title: "Quiz 4",
  //     maxScore: 100,
  //     type: "assignment" as "quiz" | "assignment",
  //   },
  // ];

  // const rows: StudentGradeRow[] = [
  //   {
  //     student: {
  //       id: "1", // FIX 1: String ID
  //       name: "John Doe",
  //       image: null, // FIX 2: Added image (can be null)
  //     },
  //     grades: {
  //       // FIX 3: Keys are Assessment IDs (as strings), values are the grade objects
  //       "1": {
  //         score: 90,
  //         status: "passed",
  //         submittedAt: new Date().toString(),
  //       },
  //       "2": {
  //         score: 85,
  //         status: "passed",
  //         submittedAt: new Date().toString(),
  //       },
  //       // If he didn't take Quiz 3, you can omit it, or set score: null
  //       "3": {
  //         score: null,
  //         status: "missing",
  //         submittedAt: null,
  //       },
  //     },
  //   },
  //   // Another student example
  //   {
  //     student: {
  //       id: "2",
  //       name: "Jane Smith",
  //       image: "https://example.com/jane.jpg",
  //     },
  //     grades: {
  //       "8": {
  //         score: 95,
  //         status: "passed",
  //         submittedAt: new Date().toString(),
  //       },
  //       // Jane hasn't done Quiz 2 yet, so it is missing from the record
  //     },
  //   },
  // ];

  const rows = gradeData.rows;

  const assessments: AssessmentColumn[] = gradeData.assessments;

  const data = { assessments, rows };

  return <GradebookDataTable data={data} />;
}
