export type SubmissionStatus = "pending" | "graded" | "late" | "missing";

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentImage: string | null;
  status: SubmissionStatus;
  score: number | null;
  maxScore: number;
  submittedAt: Date | null;
}

export interface Activity {
  id: string;
  title: string;
  type: "Quiz" | "Assignment" | "Handout";
  totalStudents: number; // Total enrolled
  submissions: StudentSubmission[];
}

export interface ClassSubject {
  id: string;
  name: string;
  code: string;
  activities: Activity[];
}

// Mock Generator
export const generateMockClasses = (): ClassSubject[] => {
  return [
    {
      id: "cs101",
      name: "Introduction to Computer Science",
      code: "CS101",
      activities: [
        {
          id: "act_1",
          title: "Quiz 1: History of Computers",
          type: "Quiz",
          totalStudents: 40,
          submissions: [
            {
              id: "s1",
              studentId: "u1",
              studentName: "Alice Johnson",
              studentImage: null,
              status: "pending",
              score: null,
              maxScore: 100,
              submittedAt: new Date(),
            },
            {
              id: "s2",
              studentId: "u2",
              studentName: "Bob Smith",
              studentImage: null,
              status: "graded",
              score: 85,
              maxScore: 100,
              submittedAt: new Date(),
            },
            {
              id: "s3",
              studentId: "u3",
              studentName: "Charlie Brown",
              studentImage: null,
              status: "missing",
              score: null,
              maxScore: 100,
              submittedAt: null,
            },
            {
              id: "s4",
              studentId: "u4",
              studentName: "Diana Prince",
              studentImage: null,
              status: "graded",
              score: 92,
              maxScore: 100,
              submittedAt: new Date(),
            },
          ],
        },
        {
          id: "act_2",
          title: "Assignment: Hardware Components",
          type: "Assignment",
          totalStudents: 40,
          submissions: [
            {
              id: "s5",
              studentId: "u1",
              studentName: "Alice Johnson",
              studentImage: null,
              status: "graded",
              score: 90,
              maxScore: 100,
              submittedAt: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: "math202",
      name: "Advanced Calculus",
      code: "MATH202",
      activities: [
        {
          id: "act_3",
          title: "Midterm Exam",
          type: "Quiz",
          totalStudents: 35,
          submissions: [],
        },
      ],
    },
  ];
};
