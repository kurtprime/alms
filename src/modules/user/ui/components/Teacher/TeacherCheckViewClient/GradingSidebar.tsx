'use client';

import { useState } from 'react'; // Removed useEffect
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, ChevronRight, AlertCircle, Send, Lock, Loader2 } from 'lucide-react';
import { StudentListResult } from '.';

interface Props {
  student: StudentListResult | undefined;
  status: string;
  lessonType: 'quiz' | 'assignment';
  onNext: () => void;
  isLastStudent: boolean;
  onSaveScore: (score: number) => void;
  onSendMessage: (message: string) => void; // Expects a string argument
  isSaving?: boolean;
}

export function GradingSidebar({
  student,
  status,
  lessonType,
  onNext,
  isLastStudent,
  onSaveScore,
  onSendMessage,
  isSaving = false,
}: Props) {
  const [score, setScore] = useState(student?.score?.toString() ?? '');
  const [message, setMessage] = useState('');

  const isMissing = status === 'missing';
  const isAutoGraded = lessonType === 'quiz';

  const handleSave = (goNext: boolean = false) => {
    const numScore = parseInt(score, 10);
    if (isNaN(numScore)) {
      onSaveScore(0);
    } else {
      onSaveScore(numScore);
    }
    if (goNext && !isLastStudent) onNext();
  };

  // Fix: Helper function to handle sending the message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(message); // Pass the message string
    setMessage(''); // Clear input after sending
  };

  return (
    <div className="flex flex-col h-full border-l bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-slate-50/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-800">
            {isAutoGraded ? 'Results' : 'Grading'}
          </h3>
          <Badge variant="outline" className="font-mono">
            Max: {student?.maxScore ?? 0}
          </Badge>
        </div>
      </div>

      {/* Score Section */}
      <div className="p-4 space-y-4 border-b">
        {isAutoGraded ? (
          <div className="bg-slate-50 border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Final Score</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-4xl font-bold text-slate-800">{student?.score ?? 0}</span>
              <span className="text-lg text-slate-400">/ {student?.maxScore ?? 0}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Auto-graded
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Enter Score</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="text-xl font-bold h-12 text-center"
                disabled={isMissing || isSaving}
                min={0}
                max={student?.maxScore ?? 100}
              />
              <span className="text-slate-400 font-medium text-sm">/ {student?.maxScore ?? 0}</span>
            </div>
          </div>
        )}

        {!isAutoGraded && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full h-10"
              disabled={isMissing || isSaving}
              onClick={() => handleSave(false)}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}{' '}
              Save
            </Button>
            {!isLastStudent && (
              <Button
                className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                disabled={isMissing || isSaving}
                onClick={() => handleSave(true)}
              >
                Save & Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Private Message Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            Private Message
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Only you and {student?.studentName?.split(' ')[0] ?? 'Student'} can see this.
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {student?.studentName && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                  {student.studentName.charAt(0)}
                </div>
                <div className="bg-slate-100 rounded-lg p-2 text-sm max-w-[85%]">
                  <p className="text-slate-600">Submitted late due to internet issues.</p>
                  <span className="text-[10px] text-slate-400 block mt-1">Yesterday</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-slate-50/50">
          <div className="relative">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pr-12 h-10 text-sm"
              disabled={isMissing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(); // Fixed: calls helper
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={!message.trim() || isMissing}
              onClick={handleSendMessage} // Fixed: calls helper
            >
              <Send className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
