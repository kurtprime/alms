import { getCurrentUser } from "@/lib/auth-server";
import ClassHandoutView from "@/modules/user/ui/Views/ClassHandoutView";

export default async function page({
  params,
}: {
  params: Promise<{ lessonTypeId: number; classId: string }>;
}) {
  const param = await params;

  return <ClassHandoutView params={param} />;
}
