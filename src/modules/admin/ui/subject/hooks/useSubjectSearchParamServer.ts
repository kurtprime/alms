import { lessonTypeEnum } from "@/db/schema";
import {
  parseAsString,
  createLoader,
  parseAsStringEnum,
  parseAsInteger,
} from "nuqs/server";

export const useTabParams = {
  tab: parseAsString.withDefault("lessons"),
};

export const useLessonTypeParams = {
  type: parseAsStringEnum(lessonTypeEnum.enumValues),
  id: parseAsInteger,
};

export const loadUseLessonTypeParams = createLoader(useLessonTypeParams);
export const loadUseTabParams = createLoader(useTabParams);
