'use client';

import { Session } from '@/lib/auth-client';
import { useTRPC } from '@/trpc/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Trash2,
  Megaphone,
  FileText,
  HelpCircle,
  ClipboardList,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GeneratedAvatar } from '@/components/generatedAvatar';
import { separateFullName } from '@/hooks/separate-name';
import ClassHeaderImage from '../ClassHeaderImage';
import TeacherAnnouncementInvite from '../TeacherAnnouncementInvite';

interface Props {
  classId: string;
  session: Session;
}

const getLessonIcon = (type: 'handout' | 'quiz' | 'assignment') => {
  switch (type) {
    case 'quiz':
      return <HelpCircle className="h-4 w-4" />;
    case 'assignment':
      return <ClipboardList className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default function AnnouncementOverview({ classId, session }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const isTeacher = session.user.role === 'teacher';

  const { data: announcementData } = useSuspenseQuery(
    trpc.user.getClassAnnouncement.queryOptions({ classId })
  );

  const { data: classSubjectDetails } = useSuspenseQuery(
    trpc.user.getClassSubjectDetails.queryOptions({ classId })
  );

  const { mutate: createAnnouncement, isPending: isCreatingAnnouncement } = useMutation(
    trpc.user.createCustomAnnouncement.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.user.getClassAnnouncement.queryOptions({ classId }));
        setNewMessage('');
        setIsCreateOpen(false);
      },
    })
  );

  const { mutate: deleteAnnouncement, isPending: isDeletingAnnouncement } = useMutation(
    trpc.user.deleteAnnouncement.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.user.getClassAnnouncement.queryOptions({ classId }));
      },
    })
  );

  const handleCreate = () => {
    if (!newMessage.trim()) return;
    createAnnouncement({ classId, message: newMessage });
  };

  const router = useRouter();

  return (
    <>
      <ClassHeaderImage
        classId={classId}
        headerImage={classSubjectDetails?.headerImage}
        isTeacher={isTeacher}
      />
      <Card className="border-none shadow-none bg-transparent px-7 -mt-4">
        <CardHeader className="flex flex-row items-center justify-between px-0">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Announcements
            </CardTitle>
            <CardDescription>Updates and messages from your teacher</CardDescription>
          </div>

          {isTeacher && (
            <div className="flex items-center gap-2">
              <TeacherAnnouncementInvite classId={classId} />
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>
                      Write a message to your class. It will be visible immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Type your announcement here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={5}
                      disabled={isCreatingAnnouncement}
                      className="resize-none"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!newMessage.trim() || isCreatingAnnouncement}
                    >
                      {isCreatingAnnouncement && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Post
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-0">
          {announcementData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-slate-500 py-16 border-2 border-dashed rounded-lg mt-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                <Megaphone className="h-8 w-8 opacity-40" />
              </div>
              <p className="font-medium">No announcements yet</p>
              <p className="text-xs mt-1 max-w-xs">
                {isTeacher
                  ? 'Create your first announcement to notify students.'
                  : 'Check back later for updates from your teacher.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              {announcementData.map((item) => (
                <div
                  key={item.id}
                  className="group relative border rounded-lg bg-card p-4 transition-all hover:shadow-sm"
                  onClick={
                    item.lessonType
                      ? () =>
                          router.push(`${classId}/${item.lessonType!.type}/${item.lessonType!.id}`)
                      : undefined
                  }
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {item.creator.image ? (
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={item.creator.image} alt={item.creator.name} />
                        <AvatarFallback className="bg-linear-to-br from-indigo-500 to-purple-600 text-white font-medium">
                          {item.creator.name}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <GeneratedAvatar
                        seed={separateFullName(item.creator.name).join(' ')}
                        variant="initials"
                        className="h-9 w-9"
                      />
                    )}

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {item.creator.name}
                          </span>
                          {item.type === 'lesson_publish' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 font-normal"
                            >
                              {item.lessonType?.type || 'Lesson'}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Lesson Link */}
                      {item.type === 'lesson_publish' && item.lessonType && (
                        <Link
                          href={`${classId}/${item.lessonType.type}/${item.lessonType.id}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-md"
                        >
                          {getLessonIcon(item.lessonType.type)}
                          <span className="truncate">{item.lessonType.name || 'View Lesson'}</span>
                          <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                        </Link>
                      )}
                    </div>

                    {/* Actions (Teacher Only) */}
                    {isTeacher && (
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this announcement. Students will no
                              longer see it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deleteAnnouncement({ id: item.id })}
                            >
                              {isDeletingAnnouncement ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
