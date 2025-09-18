"use client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React from "react";
import { AdminSectionDataTable } from "../components/AdminSectionTable";
import { columns } from "../components/_Columns";
import { useRouter } from "next/navigation";

export default function SectionView() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.admin.getManySections.queryOptions());
  const router = useRouter()
  return <AdminSectionDataTable columns={columns} data={data} onRowClick={(row)=> router.push(`/admin/sections/${row.id}`)} />;
}
