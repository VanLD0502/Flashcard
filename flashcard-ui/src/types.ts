export interface Flashcard {
  id: string;
  studySetId: string;
  questionText: string;
  answerText: string;
  questionImageUrl: string | null;
  answerImageUrl: string | null;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  username?: string;
  userId: number;
  UserId?: number;
  flashcards?: Flashcard[];
}

export interface QuizQuestion {
  flashcardId: string;
  questionText: string;
  questionImageUrl?: string;
  correctAnswer: string;
  options: string[];
}

export type User = {
  id?: number;
  userId?: number;
  UserId?: number;
  username?: string;
  Username?: string;
  token?: string;
  Token?: string;
};
