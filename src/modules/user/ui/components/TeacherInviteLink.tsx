'use client';

import { useState } from 'react';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  LinkIcon,
  Users,
  Clock,
  Loader2,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TeacherInviteLinkProps {
  classId: string;
  organizationSlug: string;
}

export default function TeacherInviteLink({ classId, organizationSlug }: TeacherInviteLinkProps) {
  const trpc = useTRPC();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'teacher' | 'irregular' | 'advisor'>('student');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresDays, setExpiresDays] = useState(7);

  const { data: classSubject } = useSuspenseQuery(
    trpc.user.getClassSubjectDetails.queryOptions({ classId })
  );

  const { data: codes, refetch: refetchCodes } = useSuspenseQuery(
    trpc.admin.getManyInviteCodes.queryOptions({
      organizationId: classSubject?.enrolledClass ?? '',
    })
  );

  const { data: requests, refetch: refetchRequests } = useSuspenseQuery(
    trpc.admin.getManyJoinRequests.queryOptions({
      organizationId: classSubject?.enrolledClass ?? '',
      status: 'pending',
    })
  );

  const createCode = useMutation(
    trpc.admin.createInviteCode.mutationOptions({
      onSuccess: (data) => {
        setGeneratedCode(data.code);
        refetchCodes();
        toast.success('Invite code created!');
      },
      onError: (error) => {
        toast.error('Failed to create code', { description: error.message });
      },
    })
  );

  const deleteCode = useMutation(
    trpc.admin.deleteInviteCode.mutationOptions({
      onSuccess: () => {
        refetchCodes();
        toast.success('Invite code deleted');
      },
      onError: (error) => {
        toast.error('Failed to delete code', { description: error.message });
      },
    })
  );

  const processRequest = useMutation(
    trpc.admin.processJoinRequest.mutationOptions({
      onSuccess: () => {
        refetchRequests();
        refetchCodes();
        toast.success('Request processed');
      },
      onError: (error) => {
        toast.error('Failed to process request', { description: error.message });
      },
    })
  );

  const handleCreateCode = () => {
    if (!classSubject?.enrolledClass) return;
    createCode.mutate({
      organizationId: classSubject.enrolledClass,
      role,
      maxUses,
      expiresInDays: expiresDays,
    });
  };

  const handleCopy = async (code: string, codeId: string) => {
    const joinUrl = `${window.location.origin}/join/${organizationSlug}?code=${code}`;
    await navigator.clipboard.writeText(joinUrl);
    setCopiedId(codeId);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    const joinUrl = `${window.location.origin}/join/${organizationSlug}?code=${generatedCode}`;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingCount = requests?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Invite Links</h2>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Generate Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invite Code</DialogTitle>
            </DialogHeader>

            {generatedCode ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-800 mb-2">Invite code created!</p>
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
                    <Button variant="outline" size="icon" onClick={handleCopyCode}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setGeneratedCode(null)}>
                  Create Another
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="irregular">Irregular</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Maximum Uses</Label>
                  <Input
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires In (Days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={expiresDays}
                    onChange={(e) => setExpiresDays(parseInt(e.target.value, 10) || 7)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateCode}
                  disabled={createCode.isPending}
                >
                  {createCode.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Generate Code'
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {pendingCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pending Requests ({pendingCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.user.name}</span>
                        <span className="text-sm text-muted-foreground">{request.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.message || 'No message'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() =>
                            processRequest.mutate({ id: request.id, action: 'approve' })
                          }
                          disabled={processRequest.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            processRequest.mutate({ id: request.id, action: 'reject' })
                          }
                          disabled={processRequest.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Active Invite Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {codes && codes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((codeItem) => {
                  const isExpired = new Date(codeItem.expiresAt) < new Date();
                  const isMaxed =
                    parseInt(codeItem.usedCount, 10) >= parseInt(codeItem.maxUses, 10);
                  const isActive = !isExpired && !isMaxed;

                  return (
                    <TableRow key={codeItem.id} className={!isActive ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {codeItem.code}
                          </code>
                          {!isActive && (
                            <Badge variant="outline" className="text-xs">
                              {isExpired ? 'Expired' : 'Maxed'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{codeItem.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {codeItem.usedCount} / {codeItem.maxUses}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(codeItem.expiresAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => handleCopy(codeItem.code, codeItem.id)}
                            >
                              {copiedId === codeItem.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteCode.mutate({ id: codeItem.id })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No invite codes yet</p>
              <p className="text-sm">Generate a code to share with students</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
