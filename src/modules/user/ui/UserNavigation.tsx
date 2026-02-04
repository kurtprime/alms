import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import React from "react";
import { getCurrentUser } from "@/lib/auth-server";
import ClassroomDropdown from "./components/Teacher/ClassroomDropdown";
import ProfilePopupClient from "./components/ProfilePopupClient";

export default function UserNavigation() {
  return (
    <div className="flex justify-between items-center border border-b px-4 py-3 w-full">
      <div className="flex h-5 items-center gap-2 text-sm">
        <SidebarTrigger />
        <Separator orientation="vertical" className="bg-black" />
        <Button variant={"link"}>LMS</Button>
      </div>
      <div className="flex gap-4 justify-between items-center">
        <AddClassroomButton />
        <ProfilePopUp />
      </div>
    </div>
  );
}

async function AddClassroomButton() {
  const session = await getCurrentUser();
  if (!session || session.user.role !== "teacher") {
    return null;
  }
  return <ClassroomDropdown isPending={false} session={session} />;
}

async function ProfilePopUp() {
  const session = await getCurrentUser();

  if (!session) {
    return <Spinner />;
  }

  const user = session.user;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return <ProfilePopupClient initials={initials} user={user} />;
}
