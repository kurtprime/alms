import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default async function Layout({ children }: Props) {
  const { session } = await getCurrentUser();
  if (session) {
    redirect("/");
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center md:p-10 bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      {children}
    </div>
  );
}
