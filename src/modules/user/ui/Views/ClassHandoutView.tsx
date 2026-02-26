import ClassHandout from "../components/Student/ClassHandout";

export default function ClassHandoutView({
  params,
}: {
  params: { classId: string; lessonTypeId: number };
}) {
  return <ClassHandout params={params} />;
}
