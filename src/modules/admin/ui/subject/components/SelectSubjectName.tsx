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

type Props = {
  field: ControllerRenderProps<
    {
      name: string;
      code: string;
      teacherId: string;
      classId: string;
      description?: string | undefined;
      status?: "published" | "draft" | "archived" | undefined;
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
  //const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectNames.queryOptions()
  );

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a subject" {...field} />
      </SelectTrigger>
      <SelectContent>
        <Command>
          <CommandInput placeholder="search for subject" />
          <CommandList>
            <CommandEmpty>No subject found.</CommandEmpty>
            <CommandGroup heading="Subjects">
              {isLoading ? (
                <CommandItem disabled>
                  <Spinner /> Loading...
                </CommandItem>
              ) : (
                data?.map((subject) => (
                  <CommandItem key={subject.id}>
                    <SelectItem value={`${subject.id}`}>
                      {subject.name}
                    </SelectItem>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        <SelectGroup>
          <Button
            onClick={() => setCreateNewSubjectName(true)}
            className="my-2 w-full"
            variant="ghost"
            size="sm"
          >
            <PlusIcon /> Create New Subject
          </Button>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
