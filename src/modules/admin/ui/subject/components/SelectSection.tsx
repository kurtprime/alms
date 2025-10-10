import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import CreateNewSubjectName from "./CreateNewSubjectName";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControllerRenderProps } from "react-hook-form";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
    "classId"
  >;
  setCreateNewSection: (open: boolean) => void;
};

export default function SelectSection({ field, setCreateNewSection }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.admin.getManySections.queryOptions({})
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
                    <SelectItem value={subject.id}>{subject.slug}</SelectItem>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
        <SelectGroup>
          <Button
            onClick={() => setCreateNewSection(true)}
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
