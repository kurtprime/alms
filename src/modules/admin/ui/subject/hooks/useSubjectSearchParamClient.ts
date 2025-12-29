import { lessonTypeEnum } from "@/db/schema";
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs";

export const useTabParams = () =>
  useQueryStates({
    tab: parseAsString.withDefault("lessons"),
  });

export const useLessonTypeParams = () =>
  useQueryStates({
    type: parseAsStringEnum(lessonTypeEnum.enumValues),
    id: parseAsInteger.withDefault(-1),
  });
