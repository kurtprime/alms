import React from "react";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import LessonTopic from "./LessonTopic";

export default function LessonRightSide() {
  const [lessonTypeParams] = useLessonTypeParams();

  if (lessonTypeParams.type === "topic" && lessonTypeParams.id != null) {
    return <LessonTopic />;
  } else if (
    lessonTypeParams.type === "activity" &&
    lessonTypeParams.id != null
  ) {
    return <div>LESSON ACTIVITY</div>;
  } else if (lessonTypeParams.type != null || lessonTypeParams.id != null) {
    return <div>It does not exist</div>;
  } else {
    return <>Not Selected anything yet</>;
  }
}
