'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, Hourglass, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StudentJoinStatusProps {
  classId: string;
}

export default function StudentJoinStatus({ classId }: StudentJoinStatusProps) {
  const trpc = useTRPC();

  const { data: classSubject } = useSuspenseQuery(
    trpc.user.getClassSubjectDetails.queryOptions({ classId })
  );

  const organizationId = classSubject?.enrolledClass ?? '';

  const { data: requests } = useSuspenseQuery(
    trpc.user.getJoinRequestStatus.queryOptions({ organizationId })
  );

  if (!organizationId) {
    return null;
  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Hourglass className="h-4 w-4" />
            Join Request Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>No join request found for this class.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  const latestRequest = requests[0];

  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Hourglass,
      className:
        'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle2,
      className:
        'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      className:
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
  };

  const status = latestRequest.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Join Request Status
        </CardTitle>
        <CardDescription>Your request to join this class</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.className.split(' ')[0]}`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium capitalize">{config.label}</p>
              <p className="text-sm text-muted-foreground">
                Requested{' '}
                {formatDistanceToNow(new Date(latestRequest.requestedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        {latestRequest.message && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Your message:</p>
            <p className="text-sm mt-1">{latestRequest.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
