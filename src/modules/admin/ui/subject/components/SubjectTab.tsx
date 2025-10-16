import React from "react";

type Props = {
  subjectId: string;
};

export default function SubjectTab({ subjectId }: Props) {
  return <div>{subjectId}</div>;
}
