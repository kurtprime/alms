"use client";

type Props = {
  subjectId: string;
};

interface Item {
  id: string;
  title: string;
  position: number;
  // ... other fields
}

// data/initialItems.ts
export const initialItems: Item[] = [
  {
    id: "1",
    title: "Complete project proposal",
    position: 0,
  },
  {
    id: "2",
    title: "Design user interface mockups",
    position: 1,
  },
  {
    id: "3",
    title: "Set up database schema",
    position: 2,
  },
  {
    id: "4",
    title: "Implement authentication system",
    position: 3,
  },
  {
    id: "5",
    title: "Write unit tests",
    position: 4,
  },
  {
    id: "6",
    title: "Deploy to production",
    position: 5,
  },
  {
    id: "7",
    title: "Document API endpoints",
    position: 6,
  },
  {
    id: "8",
    title: "Perform security audit",
    position: 7,
  },
];

export default function AdminSubjectIdView({ subjectId }: Props) {
  console.log(subjectId);
  return <p>todo</p>;
}
