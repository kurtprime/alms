import { Tabs } from "@/components/ui/tabs";
import { getCurrentAdmin } from "@/lib/auth";
import AdminUserHeader from "@/modules/admin/ui/users/components/AdminUserHeader";
import UserTabs from "@/modules/admin/ui/users/views/UserTabs";

export default async function page() {
  await getCurrentAdmin();

  return (
    <Tabs defaultValue="students" className="pb-10">
      <AdminUserHeader />
      <UserTabs />
    </Tabs>
  );
}
