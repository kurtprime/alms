import { getCurrentUser } from "@/lib/auth-server";
import TeacherDashboard from "@/modules/user/ui/Views/TeacherDashboard";

export default async function page() {
  const session = await getCurrentUser();
  return <TeacherDashboard />;
}
