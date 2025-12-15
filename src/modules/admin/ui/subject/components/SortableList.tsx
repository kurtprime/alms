// components/SortableList.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Item Component
function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// Main Sortable List Component
interface Item {
  id: string;
  title: string;
  position: number;
  // ... other fields
}

interface SortableListProps {
  initialItems: Item[];
  onOrderChange: (items: Item[]) => void;
}

export function SortableList({
  initialItems,
  onOrderChange,
}: SortableListProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with initialItems when they change
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Update local state immediately for smooth UX
      const newItems = arrayMove(items, oldIndex, newIndex);
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        position: index,
      }));

      setItems(updatedItems);

      // Save to database
      await saveToDatabase(updatedItems);
    }
  };

  const saveToDatabase = async (updatedItems: Item[]) => {
    setIsSaving(true);
    try {
      await onOrderChange(updatedItems);
    } catch (error) {
      console.error("Failed to save order:", error);
      // Optional: Revert local state on error
      setItems(items); // Revert to previous state
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {isSaving && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 rounded text-sm">
          Saving...
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              <div className="p-4 border rounded-lg mb-2 bg-white shadow-sm cursor-grab active:cursor-grabbing">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-500">
                  Position: {item.position}
                </p>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
