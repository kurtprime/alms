"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubjectItems } from "@/modules/admin/constants";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/trpc/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTabParams } from "../hooks/useTabClient";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  subjectId: string;
};

export default function SubjectIdHeader({ subjectId }: Props) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.admin.getAllSubjectInfo.queryOptions({ id: subjectId })
  );
  const [, setTab] = useTabParams();

  return (
    <>
      <div className="w-full flex flex-col md:flex-row gap-5 items-center justify-between md:pt-2 my-5 md:my-2 md:px-9 px-0">
        <h2 className="text-lg text-accent-foreground font-semibold">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <SidebarTrigger className="md:hidden" />

                <BreadcrumbLink asChild>
                  <Link
                    className="text-lg text-accent-foreground font-semibold"
                    href="/admin/subjects"
                  >
                    Subjects
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="[&>svg]:size-5 text-accent-foreground" />
              <BreadcrumbItem>
                {isLoading ? (
                  <BreadcrumbSkeleton />
                ) : !data ? (
                  <span>No data Found</span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      className="text-lg text-accent-foreground font-semibold"
                      href={`/admin/subjects/${data.id}`}
                    >
                      {data.subjectName}{" "}
                      <span className="text-muted-foreground">
                        ({data.subjectCode})
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </h2>
        <div className="flex justify-center md:justify-end">
          <TabsList className="bg-background/50 border border-border py-4 md:py-6 flex ">
            {SubjectItems.map((item) => (
              <TabsTrigger
                className="p-3 md:p-5 font-semibold text-sm md:text-md flex-shrink-0"
                key={item.title}
                value={item.value}
                onClick={() => setTab({ tab: item.value })}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      <Separator className="" />
    </>
  );
}

const BreadcrumbSkeleton = () => (
  <div className="flex items-baseline gap-1">
    <Skeleton className="h-6 w-32 rounded" />
    <Skeleton className="h-6 w-20 rounded" />
  </div>
);
