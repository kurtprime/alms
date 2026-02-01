import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ControllerRenderProps } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Props = {
  field: ControllerRenderProps<
    {
      name: string;
      code: string;
      teacherId: string;
      classId: string;
      description?: string | undefined;
      status: "draft" | "published" | "archived";
    },
    "name"
  >;
  setCreateNewSubjectName: (open: boolean) => void;
};

export default function SelectSubjectName({
  field,
  setCreateNewSubjectName,
}: Props) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();

  const { data, isLoading } = useQuery(
    session?.user.role === "admin"
      ? trpc.admin.getAllSubjectNames.queryOptions()
      : trpc.user.getAllSubjectNames.queryOptions(),
  );

  const { data: currentSubjects, isLoading: isCurrentSubjectsLoading } =
    useQuery(trpc.user.getCurrentSubjectName.queryOptions());

  // Deduplication setup
  const currentSubjectIds = new Set(currentSubjects?.map((c) => c.id) || []);
  const availableSubjects =
    data?.filter((subject) => !currentSubjectIds.has(subject.id)) || [];

  return (
    <Select
      onValueChange={field.onChange}
      value={field.value} // Use value (controlled), not defaultValue
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a subject" />
      </SelectTrigger>
      <SelectContent>
        <Command>
          <CommandInput placeholder="Search for subject" />

          {/* Current Subjects (Priority) */}
          {currentSubjects && currentSubjects.length > 0 && (
            <CommandList>
              <CommandGroup heading="Current Subjects">
                {isCurrentSubjectsLoading ? (
                  <CommandItem disabled>
                    <Spinner className="mr-2" /> Loading...
                  </CommandItem>
                ) : (
                  currentSubjects.map((subject) => (
                    <CommandItem key={`current-${subject.id}`}>
                      <SelectItem value={`${subject.id}`}>
                        {subject.name}
                      </SelectItem>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          )}

          {/* Available Subjects (Filtered duplicates) */}
          <CommandList>
            {availableSubjects.length > 0 && (
              <CommandGroup heading="Available Subjects">
                {isLoading ? (
                  <CommandItem disabled>
                    <Spinner className="mr-2" /> Loading...
                  </CommandItem>
                ) : (
                  availableSubjects.map((subject) => (
                    <CommandItem key={subject.id}>
                      <SelectItem value={`${subject.id}`}>
                        {subject.name}
                      </SelectItem>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            )}

            {/* Empty state when both lists are empty */}
            {availableSubjects.length === 0 &&
              currentSubjects?.length === 0 && (
                <CommandEmpty>No subject found.</CommandEmpty>
              )}
          </CommandList>
        </Command>

        <SelectGroup>
          <Button
            type="button" // Prevent form submission
            onClick={() => setCreateNewSubjectName(true)}
            className="my-2 w-full"
            variant="ghost"
            size="sm"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Subject
          </Button>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
