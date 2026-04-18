// src/components/SidebarAccordion.tsx
'use client';

import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FolderClosed,
  Users,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  Bell,
  Archive,
  Star,
  Sparkle,
  House,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Session } from '@/lib/auth-client';
import { SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsActivePath } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

const teacherMenuItems = [
  { title: 'Home', href: '/teacher', icon: House },
  { title: 'Classes', href: '/class', icon: BookOpen },
  { title: 'Assignments', href: '/teacher/assignments', icon: FileText },
  { title: 'Quizzes', href: '/teacher/quizzes', icon: ClipboardList },
  { title: 'Grades', href: '/teacher/grades', icon: Star },
  { title: 'AI Features', href: '/ai', icon: Sparkle },
  { title: 'Students', href: '/teacher/students', icon: Users },
  { title: 'Archives', href: '/teacher/archives', icon: Archive },
];

function TeacherMenuItem({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
}) {
  const isActive = useIsActivePath(href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn('p-4 my-1', isActive ? 'bg-primary/40 hover:bg-primary/60 text-white' : '')}
        asChild
      >
        <Link href={href}>
          <Icon className="size-6" />
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function SidebarAccordion({ session }: { session: Session }) {
  const trpc = useTRPC();
  const router = useRouter();

  // Fetch summary data
  const { data, isLoading, isError } = useQuery(trpc.user.getTeacherCheckSummary.queryOptions());

  // Find the class with the most pending items (for the "To Check" shortcut)
  const primaryClass = data?.find((c) => c.pendingCount > 0) ?? data?.[0];

  if (isLoading) {
    return (
      <div className="p-2 flex justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-2 text-xs text-destructive flex items-center gap-1 justify-center">
        <AlertCircle className="h-3 w-3" /> Error loading
      </div>
    );
  }

  return (
    <>
      {teacherMenuItems.map((item) => (
        <TeacherMenuItem key={item.title} {...item} />
      ))}
    </>
  );
}
