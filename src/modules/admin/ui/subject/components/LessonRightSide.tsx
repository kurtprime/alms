import React from "react";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import LessonTopic from "./LessonTopic";

export default function LessonRightSide() {
  const [lessonTypeParams] = useLessonTypeParams();

  if (lessonTypeParams.type === "topic" && lessonTypeParams.id != null) {
    return (
      <div>
        <LessonTopic />
      </div>
    );
  } else if (
    lessonTypeParams.type === "activity" &&
    lessonTypeParams.id != null
  ) {
    return <div>LESSON ACTIVITY</div>;
  } else if (!lessonTypeParams.type || lessonTypeParams.id == null) {
    return <div>It does not exist</div>;
  } else {
    return <>Not Selected anything yet</>;
  }
}
