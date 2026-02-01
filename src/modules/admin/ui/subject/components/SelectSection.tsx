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
import { authClient } from "@/lib/auth-client";

type Props = {
  field: ControllerRenderProps<
    {
      name: string;
      code: string;
      teacherId: string;
      classId: string;
      description?: string | undefined;
      status: "published" | "draft" | "archived";
    },
    "classId"
  >;
  setCreateNewSection: (open: boolean) => void;
};

export default function SelectSection({ field, setCreateNewSection }: Props) {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    session?.user.role === "admin"
      ? trpc.admin.getManySections.queryOptions({})
      : trpc.user.getManySections.queryOptions({}),
  );

  const { data: currentClass, isLoading: isCurrentClassLoading } = useQuery(
    trpc.user.getTheCurrentJoinedSections.queryOptions({}),
  );

  // FIX: Create Set of current class IDs for O(1) lookup
  const currentClassIds = new Set(currentClass?.map((c) => c.id) || []);

  // Filter data to exclude items already shown in Current Class
  const availableClasses =
    data?.filter((subject) => !currentClassIds.has(subject.id)) || [];

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a Class" />
      </SelectTrigger>
      <SelectContent>
        <Command>
          <CommandInput placeholder="search for class" />

          {/* Current Class Section */}
          <CommandList>
            {currentClass && currentClass.length > 0 && (
              <CommandGroup heading="Current Class">
                {isCurrentClassLoading ? (
                  <CommandItem disabled>
                    <Spinner className="mr-2" /> Loading...
                  </CommandItem>
                ) : (
                  currentClass.map((subject) => (
                    <CommandItem key={`current-${subject.id}`}>
                      <SelectItem value={subject.id}>{subject.slug}</SelectItem>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            )}
          </CommandList>

          {/* Available Classes Section (Filtered) */}
          <CommandList>
            {availableClasses.length > 0 && (
              <CommandGroup heading="Available Classes">
                {isLoading ? (
                  <CommandItem disabled>
                    <Spinner className="mr-2" /> Loading...
                  </CommandItem>
                ) : (
                  availableClasses.map((subject) => (
                    <CommandItem key={subject.id}>
                      <SelectItem value={subject.id}>{subject.slug}</SelectItem>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            )}

            {availableClasses.length === 0 && currentClass?.length === 0 && (
              <CommandEmpty>No Class found.</CommandEmpty>
            )}
          </CommandList>
        </Command>

        <SelectGroup>
          <Button
            type="button"
            onClick={() => setCreateNewSection(true)}
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
