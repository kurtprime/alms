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
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControllerRenderProps } from "react-hook-form";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type Props = {
  field: ControllerRenderProps<
    {
      name: string;
      code: string;
      teacherId: string;
      classId: string;
      description?: string | undefined;
      status?: "draft" | "published" | "archived" | undefined;
    },
    "teacherId"
  >;
  setCreateNewTeacher: (open: boolean) => void;
};

export default function SelectTeacher({ field, setCreateNewTeacher }: Props) {
  const trpc = useTRPC();
  //const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.admin.getManyTeachers.queryOptions({})
  );

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a teacher" {...field} />
      </SelectTrigger>
      <SelectContent>
        <Command>
          <CommandInput placeholder="search for teacher" />
          <CommandList>
            <CommandEmpty>No subject found.</CommandEmpty>
            <CommandGroup heading="Subjects">
              {isLoading ? (
                <CommandItem disabled>
                  <Spinner /> Loading...
                </CommandItem>
              ) : (
                data?.map((teacher) => (
                  <CommandItem key={teacher.user.id}>
                    <SelectItem value={teacher.user.id}>
                      {teacher.user.name} ({teacher.user.username})
                    </SelectItem>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        <SelectGroup>
          <Button
            onClick={() => setCreateNewTeacher(true)}
            className="my-2 w-full"
            variant="ghost"
            size="sm"
          >
            <PlusIcon /> Create New Teacher
          </Button>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
