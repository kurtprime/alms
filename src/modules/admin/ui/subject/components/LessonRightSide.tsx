import React from "react";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import LessonTopic from "./LessonTopic";

export default function LessonRightSide() {
  const [lessonTypeParams] = useLessonTypeParams();

  if (lessonTypeParams.type === "topic") {
    return <LessonTopic />;
  } else if (lessonTypeParams.type === "activity") {
    return <div>LESSON ACTIVITY</div>;
  } else {
    return <>Not Selected anything yet</>;
  }
}
