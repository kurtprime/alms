"use client";
import { Dialog } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import React from "react";
import AddSectionDialog from "./AddSectionDialog";

export default function SectionHeader() {
  return (
    <div className="w-full h-12 flex flex-row items-center justify-between my-4 px-2">
      <span className="flex items-center md:mx-7">
        <h2 className="text-lg text-accent-foreground font-semibold">
          List Sections
        </h2>
      </span>
      <Dialog>
        <AddSectionDialog />
      </Dialog>
    </div>
  );
}
