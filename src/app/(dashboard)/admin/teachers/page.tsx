import { getCurrentAdmin } from "@/lib/auth";
import React from "react";

export default async function page() {
  await getCurrentAdmin();
  return <div>Teachers</div>;
}
