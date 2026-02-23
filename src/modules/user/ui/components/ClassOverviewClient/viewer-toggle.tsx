"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentViewer } from "./context";

// ============================================
// VIEWER TOGGLE BUTTON
// ============================================

export function ViewerToggle() {
  const { isViewerOpen, toggleViewer } = useDocumentViewer();

  return (
    <div className="hidden lg:flex items-center justify-end mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleViewer}
        className="h-8 text-xs text-slate-600"
      >
        {isViewerOpen ? (
          <>
            <PanelRightClose className="w-3.5 h-3.5 mr-1.5" />
            Hide Viewer
          </>
        ) : (
          <>
            <PanelRightOpen className="w-3.5 h-3.5 mr-1.5" />
            Show Viewer
          </>
        )}
      </Button>
    </div>
  );
}
