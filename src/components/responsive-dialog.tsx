"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ScrollArea } from "./ui/scroll-area";

type ResponsiveDialogProps = {
  title: string;
  description?: string;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  /** fullscreen mode for desktop */
  variant?: "default" | "fullscreen";
  /** show close button in fullscreen header */
  showClose?: boolean;
  /** prevent dialog from closing when clicking outside (useful for DocViewer, iframes) */
};

export default function ResponsiveDialog({
  title,
  description,
  children,
  open,
  onOpenChange,
  className,
  variant = "default",
  showClose = true,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  // Mobile: always use Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("max-h-[96vh]", className)}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop fullscreen mode
  if (variant === "fullscreen") {
    return (
      <ScrollArea className="max-h-screen">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            variant="fullscreen"
            showCloseButton={false}
            className={className}
          >
            {/* VisuallyHidden title for accessibility */}
            <VisuallyHidden>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
            {description && (
              <VisuallyHidden>
                <DialogDescription>{description}</DialogDescription>
              </VisuallyHidden>
            )}

            {/* Custom visible header */}
            <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {showClose && (
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  <span className="sr-only">Close</span>
                </button>
              )}
            </div>
            {/* Content - min-h-0 is critical for flex children to scroll properly */}
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </DialogContent>
        </Dialog>
      </ScrollArea>
    );
  }

  // Desktop default mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90vh]", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
