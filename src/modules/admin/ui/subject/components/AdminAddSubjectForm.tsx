"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSubjectSchema } from "@/modules/admin/server/adminSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import CreateNewSubjectName from "./CreateNewSubjectName";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import z from "zod";

export default function AdminAddSubjectForm() {
  const [createNewSubjectName, setCreateNewSubjectName] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectNames.queryOptions()
  );

  const form = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: "",
      code: "",
      teacherId: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof createSubjectSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
                                <SelectItem value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    <SelectGroup>
                      <Dialog
                        onOpenChange={setCreateNewSubjectName}
                        open={createNewSubjectName}
                      >
                        <DialogTrigger asChild>
                          <Button
                            className="my-2 w-full"
                            variant="ghost"
                            size="sm"
                          >
                            <PlusIcon /> Create New Subject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <CreateNewSubjectName
                            onOpenChange={setCreateNewSubjectName}
                          />
                        </DialogContent>
                      </Dialog>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teacher</FormLabel>
              <FormControl>
                <Input placeholder="Select Teacher" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter subject code" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Add Subject</Button>
      </form>
    </Form>
  );
}
