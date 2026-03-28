// --- Base Interfaces ---

interface BaseQuestion {
  id: number;
  question: string;
  points: number;
  orderIndex: number;
  required: boolean | null;
  imageBase64Jpg: string | null;
  type: string; // discriminator
}

// --- Option Interfaces ---

export interface MultipleChoiceOption {
  multipleChoiceId: string;
  optionText: string;
  imageBase64Jpg: string | null;
}

export interface MatchingPair {
  matchingPairId: string;
  leftItem: string | null;
  rightItem: string; // Note: kept typo from prompt, fix in backend if possible
  leftImageBase64Jpg: string | null;
  rightImageBase64Jpg: string | null;
}

export interface OrderingOption {
  orderingOptionId: string;
  itemText: string;
  imageBase64Jpg: string | null;
}

// --- Question Type Interfaces ---

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  multipleChoices: MultipleChoiceOption[];
  multipleAnswer: boolean;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay';
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering';
  orderingOptions: OrderingOption[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  matchingOptions: MatchingPair[];
}

// --- Union Types ---

export type QuizQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | EssayQuestion
  | OrderingQuestion
  | MatchingQuestion;

// --- Answer State Types ---

// Map of questionId -> answer value
export type AnswerMap = Record<number, string | boolean | string[] | Record<string, string>>;
