import { getCurrentAdmin } from "@/lib/auth-server";
import React from "react";

export default async function page() {
  await getCurrentAdmin();

  return <div>page</div>;
}
