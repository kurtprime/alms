import { getCurrentUser } from "@/lib/auth-server";
import SettingsClient from "@/modules/user/ui/components/Settings";

export default async function SettingsPage() {
  // 1. Fetch Session Server-Side
  const session = await getCurrentUser();
  // 3. Render Client Component with Data
  return <SettingsClient user={session.user} />;
}
