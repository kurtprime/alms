import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser } from '@/lib/auth-server';
import React from 'react';
import StudentTab from '../components/StudentTab';
import ClassOverview from '../components/ClassOverview';
import AnnouncementView from './AnnouncementView';
import GradeBookView from './GradeBookView';
import { Bell, LayoutDashboard, Users, BookOpen } from 'lucide-react';

// Tab configuration to avoid repetition
const TAB_CONFIG = [
  {
    value: 'announcement',
    label: 'Announcements',
    icon: Bell,
  },
  {
    value: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    value: 'students',
    label: 'Students',
    icon: Users,
  },
  {
    value: 'gradebook',
    label: 'Gradebook',
    icon: BookOpen,
    teacherOnly: true,
  },
];

// Common classes for tabs
const baseTriggerClasses =
  'group dark relative flex items-center gap-2 rounded-lg font-medium text-gray-400 transition-all data-[state=active]:text-white data-[state=active]:bg-white/10 hover:text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500';

export default async function ClassIdView({ classId }: { classId: string }) {
  const session = await getCurrentUser();
  const isTeacher = session.user.role === 'teacher';

  // Filter tabs based on user role
  const visibleTabs = TAB_CONFIG.filter((tab) => !tab.teacherOnly || isTeacher);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile: Horizontal Tabs */}
      <div className="flex md:hidden w-full h-full bg-sidebar/92">
        <Tabs
          defaultValue="overview"
          orientation="horizontal"
          className="flex flex-col h-full w-full"
        >
          <TabsList className="flex flex-row h-auto w-full items-center justify-start rounded-none bg-transparent p-2 gap-1 shrink-0 overflow-x-auto border-b border-white/10">
            {visibleTabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={`${baseTriggerClasses} shrink-0 px-3 py-2 text-xs justify-center`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1 min-h-0 overflow-y-auto bg-background">
            <TabsContent value="announcement" className="m-0 h-full focus-visible:outline-none">
              <AnnouncementView classId={classId} session={session} />
            </TabsContent>
            <TabsContent value="overview" className="m-0 h-full focus-visible:outline-none">
              <ClassOverview session={session} classId={classId} />
            </TabsContent>
            <TabsContent value="students" className="m-0 h-full focus-visible:outline-none">
              <StudentTab classId={classId} />
            </TabsContent>
            {isTeacher && (
              <TabsContent value="gradebook" className="m-0 h-full focus-visible:outline-none">
                <GradeBookView session={session} classId={classId} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>

      {/* Desktop: Sidebar Tabs - horizontal layout */}
      <div className="hidden md:flex md:flex-row md:h-full w-full bg-sidebar/92">
        <Tabs
          defaultValue="overview"
          orientation="vertical"
          className="flex flex-row h-full w-full"
        >
          <TabsList className="flex flex-col h-full w-56 items-stretch justify-start rounded-none bg-transparent p-2 gap-1 shrink-0">
            {visibleTabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={`${baseTriggerClasses} px-4 py-3 text-sm justify-start`}
              >
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-transparent transition-colors group-data-[state=active]:bg-red-500" />
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex w-full bg-black">
            <TabsContent
              value="announcement"
              className="flex-1 w-full h-full overflow-y-auto bg-background m-0 focus-visible:outline-none"
            >
              <AnnouncementView classId={classId} session={session} />
            </TabsContent>
            <TabsContent
              value="overview"
              className="flex-1 h-full overflow-y-auto bg-background m-0 focus-visible:outline-none"
            >
              <ClassOverview session={session} classId={classId} />
            </TabsContent>
            <TabsContent
              value="students"
              className="flex-1 h-full overflow-y-auto bg-background m-0 focus-visible:outline-none"
            >
              <StudentTab classId={classId} />
            </TabsContent>
            {isTeacher && (
              <TabsContent
                value="gradebook"
                className="flex-1 h-full w-full overflow-y-auto bg-background m-0 focus-visible:outline-none"
              >
                <GradeBookView session={session} classId={classId} />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
