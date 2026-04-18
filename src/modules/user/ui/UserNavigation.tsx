import { Button } from '@/components/ui/button';
import { Search, Bell } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import React from 'react';
import { getCurrentUser } from '@/lib/auth-server';
import ClassroomDropdown from './components/Teacher/ClassroomDropdown';
import ProfilePopupClient from './components/ProfilePopupClient';
import { separateFullName } from '@/hooks/separate-name';

export default function UserNavigation() {
  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b border-border bg-background px-4 py-2 w-full">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-base font-semibold text-foreground">
                ARK Technological Institute Education System Inc.
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-64 lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 pr-4 h-8 rounded-full bg-muted/50 border-none shadow-none focus-visible:ring-1"
          />
        </div>

        <Button variant="ghost" size="icon" className="size-8 rounded-full">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </Button>

        <div className="flex items-center pl-2 ml-1 border-l h-5">
          <ProfilePopUp />
        </div>
      </div>
    </header>
  );
}

async function AddClassroomButton() {
  const session = await getCurrentUser();
  if (!session || session.user.role !== 'teacher') {
    return null;
  }
  return <ClassroomDropdown isPending={false} session={session} />;
}

async function ProfilePopUp() {
  const session = await getCurrentUser();

  if (!session) {
    return <Spinner />;
  }

  const user = session.user;
  const initials = separateFullName(user.name).join(' ');

  return <ProfilePopupClient initials={initials} user={user} />;
}
