"use client";

import React, { useState, useCallback } from "react";
import { ViewerItem } from "./types";

// ============================================
// DOCUMENT VIEWER CONTEXT
// ============================================

interface DocumentViewerContextType {
  activeItem: ViewerItem | null;
  setActiveItem: (item: ViewerItem | null) => void;
  isViewerOpen: boolean;
  toggleViewer: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const DocumentViewerContext =
  React.createContext<DocumentViewerContextType | null>(null);

export function useDocumentViewer() {
  const context = React.useContext(DocumentViewerContext);
  if (!context) {
    throw new Error(
      "useDocumentViewer must be used within DocumentViewerProvider",
    );
  }
  return context;
}

export function DocumentViewerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeItem, setActiveItem] = useState<ViewerItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleViewer = useCallback(() => setIsViewerOpen((prev) => !prev), []);
  const toggleFullscreen = useCallback(
    () => setIsFullscreen((prev) => !prev),
    [],
  );

  return (
    <DocumentViewerContext.Provider
      value={{
        activeItem,
        setActiveItem,
        isViewerOpen,
        toggleViewer,
        isFullscreen,
        toggleFullscreen,
      }}
    >
      {children}
    </DocumentViewerContext.Provider>
  );
}
