'use client';
import ResponsiveDialog from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import React from 'react';
import TeacherAddClassForm from './TeacherAddClassForm';
import { Session } from '@/lib/auth-client';

export default function ClassroomDropdown({
  session,
  isPending,
}: {
  session: Session;
  isPending: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return <></>;
}
