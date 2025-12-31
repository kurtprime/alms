import React from "react";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import LessonTopic from "./LessonTopic";
import Assignments from "./Assignments";

export default function LessonRightSide() {
  const [lessonTypeParams] = useLessonTypeParams();

  switch (lessonTypeParams.type) {
    case "handout":
      return <LessonTopic />;
    case "assignment":
      return <Assignments />;
    default:
      return <div>Not selected</div>;
  }
}
