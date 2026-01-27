import { getCurrentAdmin } from "@/lib/auth-server";
import AdminView from "@/modules/admin/ui/admin/views/AdminView";

import React from "react";

export default async function page() {
  await getCurrentAdmin();

  return <AdminView />;
}
