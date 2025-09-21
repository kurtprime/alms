import React from "react";
import AdminStudentTab from "../components/AdminStudentTab";
import AdminTeacherTab from "../components/AdminTeacherTab";
import AdminAdminTab from "../components/AdminAdminTab";

export default function UserTabs() {
  return (
    <>
      <AdminStudentTab />
      <AdminTeacherTab />
      <AdminAdminTab />
    </>
  );
}
