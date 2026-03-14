// src/modules/user/ui/components/Student/QuizRenderer/MatchingRenderer.tsx
"use client";

import React, { useState, useMemo } from "react";
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
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { GripVertical, X } from "lucide-react";

// ==========================================
// TYPES
// ==========================================

interface MatchingPair {
  matchingPairId: string;
  leftItem: string | null;
  rightItem: string;
}

interface MatchingQuestion {
  matchingOptions: MatchingPair[];
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface DraggableAnswerProps {
  id: string;
  text: string;
}

function DraggableAnswer({ id, text }: DraggableAnswerProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "relative px-4 py-3 bg-white dark:bg-slate-800 border rounded-lg shadow-sm cursor-grab active:cursor-grabbing border-slate-200 dark:border-slate-700 transition-all",
        isDragging && "opacity-30 scale-95 border-blue-400",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{text}</span>
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}

function DragOverlayItem({ text }: { text: string }) {
  return (
    <div className="px-4 py-3 bg-blue-600 text-white border rounded-lg shadow-2xl cursor-grabbing scale-105 ring-2 ring-blue-300">
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

interface DroppableSlotProps {
  id: string;
  label: string | null;
  currentAnswerId: string | null;
  allAnswersMap: Record<string, string>;
  onClear: () => void;
}

function DroppableSlot({
  id,
  label,
  currentAnswerId,
  allAnswersMap,
  onClear,
}: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const currentAnswerText = currentAnswerId
    ? allAnswersMap[currentAnswerId]
    : null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 font-medium text-slate-700 dark:text-slate-200 text-sm min-h-[48px] flex items-center">
        {label}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "w-[200px] min-h-[48px] rounded-lg border-2 border-dashed transition-all relative flex items-center justify-center",
          isOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900",
          currentAnswerId &&
            "border-solid border-green-500 bg-green-50 dark:bg-green-900/20",
        )}
      >
        {currentAnswerText ? (
          <div className="w-full">
            <div className="p-2 flex items-center justify-between group">
              <span className="text-sm truncate">{currentAnswerText}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-slate-500" />
              </button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">
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
  data: MatchingQuestion;
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
  // 1. State
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    value || {},
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // FIX: Use useMemo for shuffling - only re-shuffle when data changes
  const shuffledAnswerIds = useMemo(() => {
    if (data.matchingOptions.length === 0) return [];
    const ids = data.matchingOptions.map((p) => p.matchingPairId);
    return shuffleArray(ids);
  }, [data.matchingOptions]);

  // 2. Data Maps
  const allAnswersMap = useMemo(() => {
    const map: Record<string, string> = {};
    data.matchingOptions.forEach((pair) => {
      map[pair.matchingPairId] = pair.rightItem;
    });
    return map;
  }, [data.matchingOptions]);

  const assignedIds = Object.values(assignments).filter(Boolean) as string[];

  // Derive available answers from the pre-shuffled list
  const availableAnswerIds = useMemo(() => {
    return shuffledAnswerIds.filter((id) => !assignedIds.includes(id));
  }, [shuffledAnswerIds, assignedIds]);

  // 3. Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // 4. Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const answerId = String(active.id);
    const questionId = String(over.id);

    if (questionId.startsWith("slot-")) {
      const cleanQuestionId = questionId.replace("slot-", "");

      setAssignments((prev) => {
        const updated = { ...prev };

        // Clear previous slot for this answer
        Object.keys(updated).forEach((key) => {
          if (updated[key] === answerId) {
            updated[key] = null;
          }
        });

        // Assign new
        updated[cleanQuestionId] = answerId;

        // Clean value for parent
        const cleanValue: Record<string, string> = {};
        Object.entries(updated).forEach(([k, v]) => {
          if (v) cleanValue[k] = v;
        });
        onChange(cleanValue);

        return updated;
      });
    }
  };

  const handleClearSlot = (questionId: string) => {
    setAssignments((prev) => {
      const updated = { ...prev };
      delete updated[questionId];

      const cleanValue: Record<string, string> = {};
      Object.entries(updated).forEach(([k, v]) => {
        if (v) cleanValue[k] = v;
      });
      onChange(cleanValue);

      return updated;
    });
  };

  // 5. Render
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* COLUMN 1: QUESTIONS */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
            Questions
          </h4>
          <div className="space-y-3">
            {data.matchingOptions.map((pair) => (
              <DroppableSlot
                key={pair.matchingPairId}
                id={`slot-${pair.matchingPairId}`}
                label={pair.leftItem}
                currentAnswerId={assignments[pair.matchingPairId] || null}
                allAnswersMap={allAnswersMap}
                onClear={() => handleClearSlot(pair.matchingPairId)}
              />
            ))}
          </div>
        </div>

        {/* COLUMN 2: ANSWERS POOL */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
            Answers
          </h4>
          <div className="space-y-2 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg min-h-[100px]">
            {availableAnswerIds.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-4">
                All answers have been placed.
              </p>
            ) : (
              availableAnswerIds.map((id) => (
                <DraggableAnswer key={id} id={id} text={allAnswersMap[id]} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* DRAG OVERLAY */}
      <DragOverlay>
        {activeId ? <DragOverlayItem text={allAnswersMap[activeId]} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
