import { ContactIcon, Users2Icon, User, UserRoundCog } from "lucide-react";

export const AdminItems = [
  {
    title: "Teachers",
    url: "/admin/teachers",
    icon: ContactIcon,
  },
  {
    title: "Sections",
    url: "/admin/sections",
    icon: Users2Icon,
  },
  {
    title: "Students",
    url: "/admin/students",
    icon: User,
  },
  {
    title: "Pending Users",
    url: "/admin/pendingUsers",
    icon: UserRoundCog,
  },
];
