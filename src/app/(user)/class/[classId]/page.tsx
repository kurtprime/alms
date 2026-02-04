import ClassIdView from "@/modules/user/ui/components/Views/ClassIdView";
import React from "react";

export default async function page({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  return <ClassIdView classId={classId} />;
}
