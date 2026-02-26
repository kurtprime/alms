import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ClassHandoutLoading() {
  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="hidden sm:block h-4 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Document Viewer Skeleton */}
          <div className="lg:col-span-3 h-[calc(100vh-120px)] sticky top-2">
            <div className="h-full rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="p-2 border-b bg-slate-50 flex gap-2">
                <Skeleton className="h-7 w-20 rounded-sm" />
                <Skeleton className="h-7 w-20 rounded-sm" />
              </div>
              <div className="flex-1 p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="pt-4">
                  <Skeleton className="h-40 w-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Attachments Card Skeleton */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-800"
                  >
                    <Skeleton className="w-10 h-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Details/Action Card Skeleton */}
            <Card className="border-none shadow-sm bg-slate-100 dark:bg-slate-800/50">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
