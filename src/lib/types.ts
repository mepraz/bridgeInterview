import type { ObjectId } from 'mongodb';

export type User = {
  _id?: ObjectId;
  id: string;
  email: string;
  role: 'student' | 'admin';
  isApproved: boolean;
  name: string;
  password?: string;
};

export type Question = {
  _id?: ObjectId;
  id: string;
  text: string;
  timer: number; // in seconds
  difficulty: number; // e.g., 1-10
};

export type Answer = {
  questionId: string;
  transcript: string;
  videoUrl?: string;
  videoFileId?: string; // The file ID from ImageKit for deletion
  score?: number;
  feedback?: string;
  rawAIResponse?: string; // For debugging AI output
};

export type TestSession = {
  _id?: ObjectId;
  id: string;
  studentId: string;
  status: 'review-pending' | 'review-complete' | 'review-failed';
  answers: Answer[];
  startedAt: Date;
  completedAt?: Date;
  overallScore?: number;
  teacherFeedback?: string;
  teacherName?: string;
  idVerificationImageUrl?: string;
};

export type Session = {
  _id?: ObjectId;
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}
