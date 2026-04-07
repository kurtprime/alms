'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { organizationMemberRole } from '@/db/schema';

const createInviteCodeSchema = z.object({
  role: z.enum(organizationMemberRole.enumValues),
  maxUses: z.number().min(1),
  expiresInDays: z.number().min(1),
});

type CreateInviteCodeForm = z.infer<typeof createInviteCodeSchema>;

interface InviteCodeDialogProps {
  organizationId: string;
  organizationSlug: string;
  onSuccess?: () => void;
}

export function InviteCodeDialog({
  organizationId,
  organizationSlug,
  onSuccess,
}: InviteCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<CreateInviteCodeForm>({
    resolver: zodResolver(createInviteCodeSchema),
    defaultValues: {
      role: 'student',
      maxUses: 1,
      expiresInDays: 7,
    },
  });

  const createInviteCode = useMutation(
    trpc.admin.createInviteCode.mutationOptions({
      onSuccess: (data) => {
        setGeneratedCode(data.code);
        queryClient.invalidateQueries(
          trpc.admin.getManyInviteCodes.queryOptions({ organizationId })
        );
        onSuccess?.();
      },
      onError: (error) => {
        toast.error('Failed to create invite code', { description: error.message });
      },
    })
  );

  const handleSubmit = (values: CreateInviteCodeForm) => {
    createInviteCode.mutate({
      organizationId,
      role: values.role,
      maxUses: values.maxUses,
      expiresInDays: values.expiresInDays,
    });
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    const joinUrl = `${window.location.origin}/join/${organizationSlug}?code=${generatedCode}`;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setGeneratedCode(null);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Generate Invite Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Invite Code</DialogTitle>
        </DialogHeader>

        {generatedCode ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800 mb-2">Invite code created successfully!</p>
              <p className="text-2xl font-mono font-bold tracking-wider">{generatedCode}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Share this link:</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${organizationSlug}?code=${generatedCode}`}
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={() => setGeneratedCode(null)}>
              Create Another
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="irregular">Irregular</SelectItem>
                        <SelectItem value="advisor">Advisor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Uses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiresInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires In (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createInviteCode.isPending}>
                {createInviteCode.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Generate Code'
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
