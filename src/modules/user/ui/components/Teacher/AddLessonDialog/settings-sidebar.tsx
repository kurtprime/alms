'use client';

import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Clock, Info, Plus, RotateCcw } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { LessonTeacherData } from './types';
import LessonSelect from '../LessonSelect';
import { lessonTypeEnum } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, set } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface SettingsSidebarProps {
  form: UseFormReturn<LessonTeacherData>;
  classId: string;
  lessonType: (typeof lessonTypeEnum)['enumValues'][number];
  onOpenAddNewLesson: (open: boolean) => void;
}

export function SettingsSidebar({
  form,
  lessonType,
  classId,
  onOpenAddNewLesson,
}: SettingsSidebarProps) {
  return (
    <div className="hidden w-80 shrink-0 overflow-y-auto bg-muted/20 lg:block">
      <div className="p-6">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            {/* Lesson Select */}
            <FormField
              control={form.control}
              name="lessonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Lesson</FormLabel>
                  <FormControl>
                    <LessonSelect
                      classId={classId}
                      onLessonChange={field.onChange}
                      defaultValue={field.value}
                      setOpenAddNewLesson={onOpenAddNewLesson}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-3">
              <FormLabel className="text-sm font-medium">Quick Actions</FormLabel>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => onOpenAddNewLesson(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create New Lesson
                </Button>
              </div>

              {lessonType === 'quiz' && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="quizSettings.maxAttempts"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <Label className="text-xs text-muted-foreground">Attempts</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              className="w-32 justify-start"
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {field.value === 99 ? 'Unlimited' : `${field.value} attempts`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2">
                            <div className="grid gap-1">
                              {[1, 2, 3, 5, 10, 99].map((attempts) => (
                                <Button
                                  key={attempts}
                                  variant="ghost"
                                  type="button"
                                  size="sm"
                                  onClick={() => field.onChange(attempts)}
                                  className={field.value === attempts ? 'bg-accent' : ''}
                                >
                                  {attempts === 99 ? 'Unlimited' : `${attempts} attempts`}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  {/* Duration */}
                  <FormField
                    control={form.control}
                    name="quizSettings.timeLimit"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <Label className="text-xs text-muted-foreground">Time Limit</Label>
                        <Popover>
                          <PopoverTrigger onChange={field.onChange} asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-32 justify-start"
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {field.value === 0 ? 'No limit' : `${field.value} min`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2">
                            <div className="grid gap-1">
                              {[15, 30, 45, 60, 90, 120].map((min) => (
                                <Button
                                  key={min}
                                  variant="ghost"
                                  type="button"
                                  size="sm"
                                  onClick={() => field.onChange(min)}
                                  className={field.value === min ? 'bg-accent' : ''}
                                >
                                  {min} min
                                </Button>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => field.onChange(0)}
                                className={field.value === 0 ? 'bg-accent' : ''}
                              >
                                No limit
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-4 flex-wrap">
                    <FormField
                      control={form.control}
                      name="quizSettings.shuffleQuestions"
                      render={({ field }) => (
                        <FormItem className="flex flex-col  gap-4">
                          <Label htmlFor="shuffle" className="text-xs text-muted-foreground">
                            Shuffle Questions
                          </Label>
                          <div className="flex gap-2 items-center">
                            <FormControl>
                              <Switch
                                id="shuffle"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <HoverCard openDelay={500}>
                              <HoverCardTrigger>
                                <Info className="size-4 text-muted-foreground" />
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 text-sm">
                                Questions will appear in random order for each student.
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quizSettings.showCorrectAnswers"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-4">
                          <Label htmlFor="showAnswers" className="text-xs text-muted-foreground">
                            Show Answers
                          </Label>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                id="showAnswers"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <HoverCard openDelay={500}>
                              <HoverCardTrigger>
                                <Info className="size-4 text-muted-foreground" />
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 text-sm">
                                After a student submits the quiz, they will be able to see the
                                correct answers for each question.
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quizSettings.showScoreAfterSubmission"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-4">
                          <Label htmlFor="showScore" className="text-xs text-muted-foreground">
                            Show Score
                          </Label>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                id="showScore"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <HoverCard openDelay={500}>
                              <HoverCardTrigger>
                                <Info className="size-4 text-muted-foreground" />
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 text-sm">
                                After a student submits the quiz, they will be able to see their
                                score for each question.
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="quizSettings.endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-xs text-muted-foreground">Due Date</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                type="button"
                                className="justify-start gap-2 min-w-[200px]"
                              >
                                <CalendarIcon className="h-4 w-4 shrink-0" />
                                {field.value ? (
                                  <span className="text-sm">
                                    {format(field.value as Date, 'MMM d, h:mm a')}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No Due Date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4">
                              <div className="flex flex-col gap-3">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      field.onChange(date);
                                    }
                                  }}
                                />
                                {field.value && (
                                  <div>
                                    <Label className="text-xs">Time</Label>
                                    <Input
                                      type="time"
                                      step="60"
                                      value={format(field.value as Date, 'HH:mm')}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value
                                          .split(':')
                                          .map(Number);
                                        field.onChange(set(field.value!, { hours, minutes }));
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {lessonType === 'assignment' && (
                <>
                  <Separator />
                  {/* Max Attempts */}
                  <FormField
                    control={form.control}
                    name="quizSettings.maxAttempts"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <Label className="text-xs text-muted-foreground">Attempts</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              className="w-32 justify-start"
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {field.value === 99 ? 'Unlimited' : `${field.value} attempts`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2">
                            <div className="grid gap-1">
                              {[1, 2, 3, 5, 10, 99].map((attempts) => (
                                <Button
                                  key={attempts}
                                  variant="ghost"
                                  type="button"
                                  size="sm"
                                  onClick={() => field.onChange(attempts)}
                                  className={field.value === attempts ? 'bg-accent' : ''}
                                >
                                  {attempts === 99 ? 'Unlimited' : `${attempts} attempts`}
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quizSettings.scores"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="text-xs text-muted-foreground">Scores</Label>
                        <FormControl>
                          <Input
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            type="number"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quizSettings.endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel className="text-xs text-muted-foreground">Due Date</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                type="button"
                                className="justify-start gap-2 min-w-[200px]"
                              >
                                <CalendarIcon className="h-4 w-4 shrink-0" />
                                {field.value ? (
                                  <span className="text-sm">
                                    {format(field.value as Date, 'MMM d, h:mm a')}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No Due Date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4">
                              <div className="flex flex-col gap-3">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      field.onChange(date);
                                    }
                                  }}
                                />
                                {field.value && (
                                  <div>
                                    <Label className="text-xs">Time</Label>
                                    <Input
                                      type="time"
                                      step="60"
                                      value={format(field.value as Date, 'HH:mm')}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value
                                          .split(':')
                                          .map(Number);
                                        field.onChange(set(field.value!, { hours, minutes }));
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
