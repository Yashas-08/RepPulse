import React from 'react';

export type ScreenType =
  | 'splash'
  | 'landing'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'workout'
  | 'workout_history'
  | 'nutrition'
  | 'progress'
  | 'calendar'
  | 'friends'
  | 'profile'
  | 'settings'
  | 'notifications'
  | 'notfound';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'friend_request' | 'friend_accepted' | 'workout_completed' | 'weekly_reminder' | 'general';
  read: boolean;
  created_at: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export interface Workout {
  id: string;
  user_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  scheduled_date?: string;
  workout_date?: string;
}

export type { MealType, NutritionLog, Meal } from './types/nutrition';
export type { ProgressLog, AddProgressEntryInput, UpdateProgressEntryInput, ProgressSummary } from './types/progress';
export type { Friend, FriendProfile, UserSearchResult, PendingRequestsResult, FriendsServiceResult, ActivityStatus } from './types/friends';

