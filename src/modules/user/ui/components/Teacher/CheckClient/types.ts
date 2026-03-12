import { attemptStatusEnum } from "@/db/schema";
import { UserGetActivityPerClass } from "@/modules/user/server/userSchema";
import { NumberFieldGroupProps } from "@base-ui/react";

export type SubmissionStatus = (typeof attemptStatusEnum.enumValues)[number];

export type StudentSubmission =
  UserGetActivityPerClass[number]["activities"][number]["submissions"][number];

export type Activity = UserGetActivityPerClass[number]["activities"][number];

export type ClassSubject = UserGetActivityPerClass[number];

// Mock Generator
// export const generateMockClasses = (): ClassSubject[] => {
//   return [
//     {
//       id: "cs101",
//       name: "Introduction to Computer Science",
//       code: "CS101",
//       activities: [
//         {
//           id: "act_1",
//           title: "Quiz 1: History of Computers",
//           type: "Quiz",
//           totalStudents: 40,
//           submissions: [
//             {
//               id: "s1",
//               studentId: "u1",
//               studentName: "Alice Johnson",
//               studentImage: null,
//               status: "pending",
//               score: null,
//               maxScore: 100,
//               submittedAt: new Date(),
//             },
//             {
//               id: "s2",
//               studentId: "u2",
//               studentName: "Bob Smith",
//               studentImage: null,
//               status: "graded",
//               score: 85,
//               maxScore: 100,
//               submittedAt: new Date(),
//             },
//             {
//               id: "s3",
//               studentId: "u3",
//               studentName: "Charlie Brown",
//               studentImage: null,
//               status: "missing",
//               score: null,
//               maxScore: 100,
//               submittedAt: null,
//             },
//             {
//               id: "s4",
//               studentId: "u4",
//               studentName: "Diana Prince",
//               studentImage: null,
//               status: "graded",
//               score: 92,
//               maxScore: 100,
//               submittedAt: new Date(),
//             },
//           ],
//         },
//         {
//           id: "act_2",
//           title: "Assignment: Hardware Components",
//           type: "Assignment",
//           totalStudents: 40,
//           submissions: [
//             {
//               id: "s5",
//               studentId: "u1",
//               studentName: "Alice Johnson",
//               studentImage: null,
//               status: "graded",
//               score: 90,
//               maxScore: 100,
//               submittedAt: new Date(),
//             },
//           ],
//         },
//       ],
//     },
//     {
//       id: "math202",
//       name: "Advanced Calculus",
//       code: "MATH202",
//       activities: [
//         {
//           id: "act_3",
//           title: "Midterm Exam",
//           type: "Quiz",
//           totalStudents: 35,
//           submissions: [],
//         },
//       ],
//     },
//   ];
// };
