'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const { data: org, isLoading: orgLoading } = useQuery(
    trpc.user.getOrganizationBySlug.queryOptions({ slug })
  );

  const {
    data: requests,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery(
    trpc.user.getJoinRequestStatus.queryOptions(
      { organizationId: org?.id ?? '' },
      { enabled: !!org?.id }
    )
  );

  const requestJoin = useMutation(
    trpc.user.requestJoin.mutationOptions({
      onSuccess: () => {
        toast.success('Request Sent', {
          description: 'Your join request has been submitted for approval.',
        });
        setCode('');
        setMessage('');
        refetchRequests();
      },
      onError: (error) => {
        toast.error('Request Failed', {
          description: error.message,
        });
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Code Required', { description: 'Please enter an invite code.' });
      return;
    }
    requestJoin.mutate({ slug, code: code.trim(), message });
  };

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization Not Found</h1>
        <p className="text-gray-600 mb-6">The organization &quot;{slug}&quot; does not exist.</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  const pendingRequest = requests?.find((r) => r.status === 'pending');
  const latestRequest = requests?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          {org.logo && (
            <div className="relative h-12 w-12">
              <Image src={org.logo} alt={org.name} fill className="object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{org.name}</h1>
            <p className="text-sm text-gray-500">Request to Join</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        {pendingRequest ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Request Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your join request is currently pending approval from an administrator. You will be
                notified once your request has been reviewed.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Status:</strong> Pending Review
                </p>
              </div>
            </CardContent>
          </Card>
        ) : latestRequest && latestRequest.status === 'approved' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Already Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your join request has been approved! You are now a member of {org.name}.
              </p>
              <Link href="/">
                <Button className="w-full bg-red-600 hover:bg-red-700">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : latestRequest && latestRequest.status === 'rejected' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Request Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Your previous join request was rejected. If you believe this is a mistake, please
                contact an administrator.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Invite Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    maxLength={20}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={requestJoin.isPending}
                >
                  {requestJoin.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit New Request'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Request to Join</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Enter the invite code provided by your teacher or administrator to request to join{' '}
                <strong>{org.name}</strong>.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Invite Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    maxLength={20}
                    className="mt-1 font-mono text-lg tracking-wider"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={requestJoin.isPending}
                >
                  {requestJoin.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
