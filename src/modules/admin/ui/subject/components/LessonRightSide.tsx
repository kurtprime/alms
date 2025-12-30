import React from "react";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import LessonTopic from "./LessonTopic";

export default function LessonRightSide() {
  const [lessonTypeParams] = useLessonTypeParams();

  switch (lessonTypeParams.type) {
    case "handout":
      return <LessonTopic />;
    case "assignment":
      return <div>Assignment Lesson Type - To be implemented</div>;
    default:
      return <div>Not selected</div>;
  }
}
