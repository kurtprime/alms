import {
  ContactIcon,
  Users2Icon,
  User,
  Book,
  GraduationCap,
  BookOpen,
  BookOpenCheck,
} from "lucide-react";

export const AdminItems = [
  {
    title: "Users",
    url: "/admin/users",
    icon: User,
  },
  {
    title: "Sections",
    url: "/admin/sections",
    icon: Users2Icon,
  },

  {
    title: "Subjects",
    url: "/admin/subjects",
    icon: Book,
  },
];

export const UserItems = [
  {
    title: "Students",
    value: "students",
    icon: GraduationCap,
  },
  {
    title: "Teachers",
    value: "teachers",
    icon: ContactIcon,
  },
  {
    title: "Admins",
    value: "admins",
    icon: User,
  },
];

export const SubjectItems = [
  {
    title: "Lessons",
    value: "lessons",
    icon: BookOpen,
  },
  {
    title: "Grades",
    value: "grades",
    icon: BookOpenCheck,
  },
  {
    title: "Students",
    value: "students",
    icon: GraduationCap,
  },
];
