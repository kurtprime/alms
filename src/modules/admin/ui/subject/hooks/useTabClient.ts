import { useQueryStates, parseAsString } from "nuqs";

export const useTabParams = () =>
  useQueryStates({
    tab: parseAsString.withDefault("lessons"),
  });
