// src/modules/user/ui/Views/components/QuizRenderers/OrderingRenderer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { OrderingOption, OrderingQuestion } from "./types";

interface Props {
  data: OrderingQuestion;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

function SortableItem({ id, text }: { id: string; text: string }) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border rounded-lg shadow-sm",
        isDragging && "z-10 shadow-xl",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="cursor-grab shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-slate-400" />
      </Button>
      <span className="font-medium">{text}</span>
    </div>
  );
}

export function OrderingRenderer({ data, value, onChange }: Props) {
  // Initialize items if not present
  const items: string[] =
    value ||
    data.orderingOptions.map((o: OrderingOption) => o.orderingOptionId);

  const itemMap = data.orderingOptions.reduce<Record<string, string>>(
    (acc, curr) => {
      acc[curr.orderingOptionId] = curr.itemText;
      return acc;
    },
    {},
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      const newArray = arrayMove(items, oldIndex, newIndex);
      onChange(newArray);
    }
    console.log("ITEM: ", items);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        Drag items into the correct order:
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((id) => (
              <SortableItem key={id} id={id} text={itemMap[id]} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
