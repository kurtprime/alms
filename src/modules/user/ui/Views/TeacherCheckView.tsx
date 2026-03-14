import TeacherCheckViewClient from "../components/Teacher/TeacherCheckViewClient";

export default function TeacherCheckView({
  params,
}: {
  params:  { classId: string; lessonTypeId: string } 
}){
  return <TeacherCheckViewClient />
}