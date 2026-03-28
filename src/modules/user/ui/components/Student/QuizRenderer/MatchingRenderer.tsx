// src/modules/user/ui/components/Student/QuizRenderer/MatchingRenderer.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  useDraggable,
  rectIntersection,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { GripVertical, X } from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

interface MatchingPair {
  matchingPairId: string;
  leftItem: string | null;
  leftImageBase64Jpg?: string | null;
  rightItem: string;
  rightImageBase64Jpg?: string | null;
}

interface MatchingQuestion {
  matchingOptions: MatchingPair[];
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface DraggableAnswerProps {
  id: string;
  text: string | null;
  image: string | null;
}

function DraggableAnswer({ id, text, image }: DraggableAnswerProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'relative px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg shadow-sm cursor-grab active:cursor-grabbing border-slate-200 dark:border-slate-700 transition-all',
        isDragging && 'opacity-30 scale-95 border-blue-400'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {image ? (
          <img src={image} alt="" className="h-6 w-6 object-cover rounded mr-2" />
        ) : (
          <span className="text-sm font-medium truncate">{text || 'Item'}</span>
        )}
        <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
      </div>
    </div>
  );
}

function DragOverlayItem({ text, image }: { text: string | null; image: string | null }) {
  return (
    <div className="px-4 py-3 bg-blue-600 text-white border rounded-lg shadow-2xl cursor-grabbing scale-105 ring-2 ring-blue-300 flex items-center gap-2">
      {image ? (
        <img src={image} alt="" className="h-6 w-6 object-cover rounded" />
      ) : (
        <span className="text-sm font-medium">{text || 'Item'}</span>
      )}
    </div>
  );
}

interface DroppableSlotProps {
  id: string;
  label: string | null;
  imageLabel: string | null;
  currentAnswer: { id: string; text: string | null; image: string | null } | null;
  onClear: () => void;
}

function DroppableSlot({ id, label, imageLabel, currentAnswer, onClear }: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex items-center gap-4">
      {/* Left Item (Static) */}
      <div className="flex-1 font-medium text-slate-700 dark:text-slate-200 text-sm min-h-[48px] flex items-center">
        {imageLabel ? (
          <img src={imageLabel} alt="" className="h-8 w-8 object-cover rounded mr-2" />
        ) : (
          label
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'w-[200px] min-h-[48px] rounded-lg border-2 border-dashed transition-all relative flex items-center justify-center',
          isOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900',
          currentAnswer && 'border-solid border-green-500 bg-green-50 dark:bg-green-900/20'
        )}
      >
        {currentAnswer ? (
          <div className="w-full">
            <div className="p-2 flex items-center justify-between group">
              <div className="flex items-center gap-1 truncate">
                {currentAnswer.image ? (
                  <img src={currentAnswer.image} alt="" className="h-6 w-6 object-cover rounded" />
                ) : (
                  <span className="text-sm truncate">{currentAnswer.text}</span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <X className="h-3 w-3 text-slate-500" />
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
            Drop here
          </span>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

interface Props {
  data: {
    matchingOptions: MatchingPair[];
  };
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string>) => void;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MatchingRenderer({ data, value, onChange }: Props) {
  const { matchingOptions } = data;

  // 1. Initialize state synchronously using the initializer function
  // This avoids the useEffect setState error.
  const [rightItems, setRightItems] = useState(() => {
    const items = matchingOptions.map((p) => ({
      id: p.matchingPairId,
      text: p.rightItem ?? null, // Ensure null if undefined
      image: p.rightImageBase64Jpg ?? null, // Ensure null if undefined
    }));
    return shuffleArray(items);
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  // 2. Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires moving 8px before starting drag
      },
    })
  );

  // 3. Helpers
  const getAnswerDetails = (id: string) => rightItems.find((r) => r.id === id);

  // 4. Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return; // Dropped outside

    const sourceId = active.id as string; // Right Item ID
    const destId = over.id as string; // Left Slot ID

    // Create new mapping
    const newValue = { ...(value || {}) };

    // Remove the dragged item if it was already in a slot
    Object.keys(newValue).forEach((key) => {
      if (newValue[key] === sourceId) {
        delete newValue[key];
      }
    });

    // Add new mapping
    newValue[destId] = sourceId;

    onChange(newValue);
  };

  const handleClear = (slotId: string) => {
    const newValue = { ...(value || {}) };
    delete newValue[slotId];
    onChange(newValue);
  };

  // 5. Derived Data
  // We hide the draggable item from the list if it is currently placed in a slot
  const placedIds = useMemo(() => new Set(Object.values(value || {})), [value]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* LEFT COLUMN (Static Labels + Drop Slots) */}
        <div className="space-y-3">
          {matchingOptions.map((pair) => {
            const currentAnswerId = value?.[pair.matchingPairId];
            const currentAnswer = currentAnswerId
              ? {
                  ...(getAnswerDetails(currentAnswerId) || { text: 'Unknown', image: null }),
                  id: currentAnswerId,
                }
              : null;

            return (
              <DroppableSlot
                key={pair.matchingPairId}
                id={pair.matchingPairId} // The ID we check against in handleDragEnd
                label={pair.leftItem}
                imageLabel={pair.leftImageBase64Jpg ?? null}
                currentAnswer={currentAnswer}
                onClear={() => handleClear(pair.matchingPairId)}
              />
            );
          })}
        </div>

        {/* RIGHT COLUMN (Draggable Items) */}
        <div className="mt-6 pt-4 border-t dark:border-slate-700">
          <h4 className="text-xs text-muted-foreground mb-3">
            Drag items from here to the matching slots
          </h4>
          <div className="flex flex-wrap gap-2">
            {rightItems.map((item) => {
              // If item is placed in a slot, don't show it in the list
              if (placedIds.has(item.id)) return null;

              return (
                <DraggableAnswer key={item.id} id={item.id} text={item.text} image={item.image} />
              );
            })}
          </div>
        </div>

        {/* DRAG OVERLAY */}
        <DragOverlay>
          {activeId ? (
            <DragOverlayItem
              text={getAnswerDetails(activeId)?.text ?? null}
              image={getAnswerDetails(activeId)?.image ?? null}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
