import QuizEditClient from "@/modules/user/ui/Views/QuizEditView";

export default async function page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  return <QuizEditClient quizId={quizId} />;
}
