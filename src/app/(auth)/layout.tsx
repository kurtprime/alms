import { auth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default async function Layout({ children }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  if (session) {
    redirect("/");
  }
  return (
    <div className="bg-muted flex min-h-svh w-full flex-col items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  );
}
