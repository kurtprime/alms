import { parseAsString, createLoader } from "nuqs/server";

export const useTabParams = {
  tab: parseAsString.withDefault("lessons"),
};

export const loadUseTabParams = createLoader(useTabParams);
