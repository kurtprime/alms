'use client';

import { useState } from 'react';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import TeacherInviteLink from './TeacherInviteLink';

interface TeacherAnnouncementInviteProps {
  classId: string;
}

export default function TeacherAnnouncementInvite({ classId }: TeacherAnnouncementInviteProps) {
  const trpc = useTRPC();
  const [isOpen, setIsOpen] = useState(false);

  const { data: classSubject } = useSuspenseQuery(
    trpc.user.getClassSubjectDetails.queryOptions({ classId })
  );

  const { data: requests } = useSuspenseQuery(
    trpc.admin.getManyJoinRequests.queryOptions({
      organizationId: classSubject?.enrolledClass ?? '',
      status: 'pending',
    })
  );

  const pendingCount = requests?.length ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="relative">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Invitations</DialogTitle>
        </DialogHeader>
        <TeacherInviteLink
          classId={classId}
          organizationSlug={classSubject?.organizationSlug ?? ''}
        />
      </DialogContent>
    </Dialog>
  );
}
