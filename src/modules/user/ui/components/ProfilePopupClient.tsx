"use client";
import { GeneratedAvatar } from "@/components/generatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { authClient, Session } from "@/lib/auth-client";
import { LogOut, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function ProfilePopupClient({
  initials,
  user,
}: {
  initials: string;
  user: Session["user"];
}) {
  const router = useRouter();
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2"
        >
          {user.image ? (
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar
              seed={user.name}
              variant="initials"
              className="h-9 w-9"
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header with User Info */}
        <div className="flex flex-col gap-4 p-5 pb-3">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold leading-none truncate">
                  {user.name}
                </p>
                {user.banned && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1 py-0"
                  >
                    Banned
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {user.displayUsername || user.username || user.email}
              </p>

              {user.role && (
                <Badge
                  variant="secondary"
                  className="w-fit mt-1 text-xs font-normal"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {user.role}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation Links */}
        <div className="p-2">
          <nav className="flex flex-col gap-1">
            <Link href="/settings">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 px-2 text-sm font-normal"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </Button>
            </Link>
          </nav>
        </div>

        <Separator />

        {/* Footer with Sign Out */}
        <div className="p-2">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start gap-2 h-9 px-2 text-sm font-normal text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>

        {/* Footer Info */}
        <div className="bg-muted/50 p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            Signed in as
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
