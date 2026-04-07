import ClassIdViewWrapper from '@/modules/user/ui/Views/ClassIdViewWrapper';
import ClassIdView from '@/modules/user/ui/Views/ClassIdView';
import React from 'react';

export default async function page({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;

  return (
    <ClassIdViewWrapper>
      <ClassIdView classId={classId} />
    </ClassIdViewWrapper>
  );
}
