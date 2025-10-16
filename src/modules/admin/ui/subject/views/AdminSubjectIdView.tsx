import React from "react";
import SubjectIdHeader from "../components/SubjectIdHeader";

type Props = {
  subjectId: string;
};

export default function AdminSubjectIdView({ subjectId }: Props) {
  return <SubjectIdHeader subjectId={subjectId} />;
}
