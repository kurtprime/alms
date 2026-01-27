import { redirect } from "next/navigation";
import SidebarUserButton from "@/components/SidebarUserButton";
import { getCurrentUser } from "@/lib/auth-server";

export default async function Home() {
  const { user } = await getCurrentUser();
  const userRole = user?.role;

  if (!userRole) return <div className="">user not signed in</div>;

  if (userRole === "student") {
    redirect("/student");
  } else if (userRole === "admin") {
    redirect("/admin");
  } else if (userRole === "teacher") {
    redirect("/teacher");
  } else {
    return (
      <div>
        <SidebarUserButton />
      </div>
    );
  }
}
