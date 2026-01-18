import React from "react";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import LessonTopic from "./LessonTopic";
import Assignments from "./Assignments";

export default function LessonRightSide() {
  const [lessonTypeParams] = useLessonTypeParams();

  switch (lessonTypeParams.type) {
    case "handout":
      return <LessonTopic key={lessonTypeParams.id} />;
    case "assignment":
      return <Assignments key={lessonTypeParams.id} />;
    default:
      return <div>Not selected</div>;
  }
}
