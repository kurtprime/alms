// "use client";

import React from "react";

export default function TeacherDashboard() {
  return <div>TeacherDashboard</div>;
}

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   BookOpen,
//   FileCheck,
//   Users,
//   ArrowRight,
//   GraduationCap,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Search,
//   Filter,
//   LayoutGrid,
//   List,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { useTRPC } from "@/trpc/client";

// // ==========================================
// // 1. TYPES
// // ==========================================

// export interface TeacherClassStats {
//   id: string;
//   className: string;
//   subjectName: string;
//   organizationName: string;
//   term: string | null;
//   stats: {
//     totalActivities: number;
//     totalQuizzes: number;
//     totalAssignments: number;
//     totalSubmissions: number;
//     pendingGrading: number;
//     totalStudents: number;
//   };
// }

// // ==========================================
// // 2. LOADING SKELETON
// // ==========================================

// function ClassCardSkeleton() {
//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <div className="flex items-start justify-between">
//           <div className="space-y-2">
//             <Skeleton className="h-6 w-32" />
//             <Skeleton className="h-4 w-24" />
//           </div>
//           <Skeleton className="h-6 w-20" />
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-4">
//           <div className="grid grid-cols-3 gap-4">
//             <Skeleton className="h-16 w-full" />
//             <Skeleton className="h-16 w-full" />
//             <Skeleton className="h-16 w-full" />
//           </div>
//           <Skeleton className="h-4 w-full" />
//           <Skeleton className="h-4 w-2/3" />
//         </div>
//       </CardContent>
//       <CardFooter>
//         <Skeleton className="h-10 w-full" />
//       </CardFooter>
//     </Card>
//   );
// }

// function DashboardSkeleton() {
//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       {/* Header Skeleton */}
//       <div className="space-y-2">
//         <Skeleton className="h-8 w-48" />
//         <Skeleton className="h-4 w-72" />
//       </div>

//       {/* Filter Skeleton */}
//       <div className="flex gap-4">
//         <Skeleton className="h-10 w-64" />
//         <Skeleton className="h-10 w-48" />
//       </div>

//       {/* Cards Grid Skeleton */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {[...Array(6)].map((_, i) => (
//           <ClassCardSkeleton key={i} />
//         ))}
//       </div>
//     </div>
//   );
// }

// // ==========================================
// // 3. EMPTY STATE
// // ==========================================

// function EmptyState() {
//   return (
//     <div className="container mx-auto p-6">
//       <Card className="max-w-md mx-auto">
//         <CardContent className="pt-6 text-center space-y-4">
//           <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
//             <GraduationCap className="h-12 w-12 text-slate-400" />
//           </div>
//           <div className="space-y-2">
//             <h3 className="text-xl font-semibold">No Classes Yet</h3>
//             <p className="text-slate-500">
//               You haven&apos;t been assigned to any classes yet. Contact your
//               administrator to get started.
//             </p>
//           </div>
//           <Button className="w-full" variant="outline">
//             Contact Administrator
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// // ==========================================
// // 4. STAT BADGE COMPONENT
// // ==========================================

// function StatBadge({
//   icon: Icon,
//   label,
//   value,
//   variant = "default",
//   tooltip,
// }: {
//   icon: React.ElementType;
//   label: string;
//   value: number | string;
//   variant?: "default" | "success" | "warning" | "info";
//   tooltip?: string;
// }) {
//   const variants = {
//     default: "bg-slate-100 text-slate-700",
//     success: "bg-emerald-100 text-emerald-700",
//     warning: "bg-amber-100 text-amber-700",
//     info: "bg-blue-100 text-blue-700",
//   };

//   const iconVariants = {
//     default: "text-slate-500",
//     success: "text-emerald-600",
//     warning: "text-amber-600",
//     info: "text-blue-600",
//   };

//   const badgeContent = (
//     <div
//       className={`flex flex-col items-center justify-center p-3 rounded-lg ${variants[variant]} transition-colors`}
//     >
//       <Icon className={`h-4 w-4 mb-1 ${iconVariants[variant]}`} />
//       <span className="text-lg font-bold">{value}</span>
//       <span className="text-xs opacity-80">{label}</span>
//     </div>
//   );

//   if (tooltip) {
//     return (
//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
//           <TooltipContent>
//             <p>{tooltip}</p>
//           </TooltipContent>
//         </Tooltip>
//       </TooltipProvider>
//     );
//   }

//   return badgeContent;
// }

// // ==========================================
// // 5. CLASS CARD COMPONENT
// // ==========================================

// function ClassCard({
//   classData,
//   onClick,
// }: {
//   classData: TeacherClassStats;
//   onClick: () => void;
// }) {
//   const [isHovered, setIsHovered] = useState(false);

//   return (
//     <Card
//       className={`
//         group cursor-pointer transition-all duration-200
//         hover:shadow-lg hover:-translate-y-1 hover:border-primary/20
//         ${isHovered ? "border-primary/30" : "border-border"}
//       `}
//       onClick={onClick}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       <CardHeader className="pb-3">
//         <div className="flex items-start justify-between gap-2">
//           <div className="space-y-1 min-w-0">
//             <CardTitle className="text-lg font-semibold truncate">
//               {classData.className}
//             </CardTitle>
//             <CardDescription className="flex items-center gap-1 text-sm">
//               <BookOpen className="h-3 w-3 shrink-0" />
//               <span className="truncate">{classData.subjectName}</span>
//             </CardDescription>
//           </div>
//           {classData.term && (
//             <Badge variant="secondary" className="shrink-0 text-xs">
//               {classData.term}
//             </Badge>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent className="pb-3">
//         <div className="space-y-4">
//           {/* Stats Grid */}
//           <div className="grid grid-cols-3 gap-2">
//             <StatBadge
//               icon={BookOpen}
//               label="Activities"
//               value={classData.stats.totalActivities}
//               variant="info"
//               tooltip={`${classData.stats.totalQuizzes} quizzes, ${classData.stats.totalAssignments} assignments`}
//             />
//             <StatBadge
//               icon={FileCheck}
//               label="Submitted"
//               value={classData.stats.totalSubmissions}
//               variant="success"
//               tooltip="Total submissions received"
//             />
//             <StatBadge
//               icon={AlertCircle}
//               label="Pending"
//               value={classData.stats.pendingGrading}
//               variant="warning"
//               tooltip="Submissions awaiting grading"
//             />
//           </div>

//           {/* Progress Indicator */}
//           {classData.stats.totalActivities > 0 && (
//             <div className="space-y-1">
//               <div className="flex items-center justify-between text-xs text-slate-500">
//                 <span>Submission Rate</span>
//                 <span>
//                   {classData.stats.totalActivities > 0
//                     ? Math.round(
//                         (classData.stats.totalSubmissions /
//                           (classData.stats.totalActivities *
//                             classData.stats.totalStudents)) *
//                           100,
//                       )
//                     : 0}
//                   %
//                 </span>
//               </div>
//               <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
//                   style={{
//                     width: `${
//                       classData.stats.totalActivities > 0
//                         ? Math.min(
//                             (classData.stats.totalSubmissions /
//                               (classData.stats.totalActivities *
//                                 classData.stats.totalStudents)) *
//                               100,
//                             100,
//                           )
//                         : 0
//                     }%`,
//                   }}
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//       </CardContent>

//       <CardFooter className="pt-0">
//         <Button
//           variant="ghost"
//           className="w-full justify-between group-hover:bg-primary/5"
//         >
//           <span className="flex items-center gap-2">
//             <Users className="h-4 w-4" />
//             <span>{classData.stats.totalStudents || 0} Students</span>
//           </span>
//           <span className="flex items-center gap-1 text-primary">
//             View Class
//             <ArrowRight
//               className={`h-4 w-4 transition-transform ${isHovered ? "translate-x-1" : ""}`}
//             />
//           </span>
//         </Button>
//       </CardFooter>
//     </Card>
//   );
// }

// // ==========================================
// // 6. MAIN DASHBOARD COMPONENT
// // ==========================================

// interface TeacherDashboardProps {
//   classes: TeacherClassStats[];
//   isLoading?: boolean;
// }

// export default function TeacherDashboard() {
//   // {
//   //   // classes,
//   //   // isLoading = false,
//   // }: TeacherDashboardProps,
//   const router = useRouter();
//   const trpc = useTRPC();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [termFilter, setTermFilter] = useState("all");

//   const {
//     data: classData,
//     isLoading,
//     isError,
//   } = useQuery(trpc.user.getMyTeachingAssignments.queryOptions());
//   if (!classData && isLoading) return null;

//   const classes = classData ?? [];
//   // Filter classes based on search and term
//   const filteredClasses = classes.filter((cls) => {
//     const matchesSearch =
//       cls.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       cls.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

//     const matchesTerm = termFilter === "all" || cls.terms === termFilter;

//     return matchesSearch && matchesTerm;
//   });

//   // Get unique terms for filter
//   const terms = Array.from(
//     new Set(classes.map((c) => c.terms).filter(Boolean)),
//   );

//   // Loading state
//   if (isLoading) {
//     return <DashboardSkeleton />;
//   }

//   // Empty state
//   if (classes.length === 0) {
//     return <EmptyState />;
//   }

//   // No results after filtering
//   if (filteredClasses.length === 0) {
//     return (
//       <div className="container mx-auto p-6">
//         <div className="space-y-4 mb-6">
//           <div className="space-y-2">
//             <h2 className="text-2xl font-bold">My Classes</h2>
//             <p className="text-slate-500">
//               Manage your curriculum and track student progress.
//             </p>
//           </div>

//           {/* Filters */}
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="relative flex-1 max-w-md">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//               <Input
//                 placeholder="Search classes..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-9"
//               />
//             </div>
//             <Select value={termFilter} onValueChange={setTermFilter}>
//               <SelectTrigger className="w-full sm:w-48">
//                 <Filter className="h-4 w-4 mr-2" />
//                 <SelectValue placeholder="Filter by term" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Terms</SelectItem>
//                 {terms.map((term) => (
//                   <SelectItem key={term} value={term!}>
//                     {term}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         {/* No Results */}
//         <Card className="max-w-md mx-auto">
//           <CardContent className="pt-6 text-center space-y-4">
//             <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
//               <Search className="h-12 w-12 text-slate-400" />
//             </div>
//             <div className="space-y-2">
//               <h3 className="text-xl font-semibold">No Classes Found</h3>
//               <p className="text-slate-500">
//                 No classes match your search criteria. Try adjusting your
//                 filters.
//               </p>
//             </div>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setSearchQuery("");
//                 setTermFilter("all");
//               }}
//             >
//               Clear Filters
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="space-y-2">
//         <h2 className="text-2xl font-bold">My Classes</h2>
//         <p className="text-slate-500">
//           Manage your curriculum and track student progress.
//         </p>
//       </div>

//       {/* Filters */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//           <Input
//             placeholder="Search classes..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="pl-9"
//           />
//         </div>
//         <Select value={termFilter} onValueChange={setTermFilter}>
//           <SelectTrigger className="w-full sm:w-48">
//             <Filter className="h-4 w-4 mr-2" />
//             <SelectValue placeholder="Filter by term" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Terms</SelectItem>
//             {terms.map((term) => (
//               <SelectItem key={term} value={term!}>
//                 {term}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Stats Summary */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <LayoutGrid className="h-5 w-5 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{filteredClasses.length}</p>
//                 <p className="text-sm text-slate-500">Total Classes</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-purple-100 rounded-lg">
//                 <BookOpen className="h-5 w-5 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">
//                   {filteredClasses.reduce(
//                     (sum, c) => sum + c.stats.totalActivities,
//                     0,
//                   )}
//                 </p>
//                 <p className="text-sm text-slate-500">Total Activities</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-emerald-100 rounded-lg">
//                 <FileCheck className="h-5 w-5 text-emerald-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">
//                   {filteredClasses.reduce(
//                     (sum, c) => sum + c.stats.totalSubmissions,
//                     0,
//                   )}
//                 </p>
//                 <p className="text-sm text-slate-500">Submissions</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-amber-100 rounded-lg">
//                 <AlertCircle className="h-5 w-5 text-amber-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">
//                   {filteredClasses.reduce(
//                     (sum, c) => sum + c.stats.pendingGrading,
//                     0,
//                   )}
//                 </p>
//                 <p className="text-sm text-slate-500">Pending Grading</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Classes Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredClasses.map((classData) => (
//           <ClassCard
//             key={classData.id}
//             classData={{
//               ...classData,
//               term: classData.terms,
//             }}
//             onClick={() => router.push(`/dashboard/classes/${classData.id}`)}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }
