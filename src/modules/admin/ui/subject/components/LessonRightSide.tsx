import React from "react";
import { useLessonTypeParams } from "../hooks/useSubjectSearchParamClient";
import LessonTopic from "./LessonTopic";

/**
 * Render the right-side content for a lesson based on current lesson type parameters.
 *
 * @returns A React element for the selected lesson type: `LessonTopic` when the type is `"handout"`, a placeholder `<div>` for `"assignment"`, or a `<div>` with "Not selected" for any other type.
 */
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