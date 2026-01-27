import { getCurrentAdmin } from "@/lib/auth";
import SubjectHeader from "@/modules/admin/ui/subject/components/SubjectHeader";
import AdminSubjectViews from "@/modules/admin/ui/subject/views/AdminSubjectViews";
import React from "react";

export default async function page() {
  await getCurrentAdmin();

  return (
    <>
      <SubjectHeader />
      <AdminSubjectViews />
    </>
  );
}
