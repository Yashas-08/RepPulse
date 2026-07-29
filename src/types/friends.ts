export type ActivityStatus = 'active_today' | 'active_week' | 'inactive';

export interface Friend {
  friendshipId: string;
  friendId: string;
  email: string;
  full_name: string;
  activityStatus: ActivityStatus;
  created_at: string;
  accepted_at: string | null;
  profile_image?: string | null;
  workout_streak?: number;
  completed_workouts_count?: number;
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string;
  profile_image?: string | null;
  isFriend: boolean;
  isPendingIncoming: boolean;
  isPendingOutgoing: boolean;
}

export interface FriendProfile {
  friendId: string;
  email: string;
  full_name: string;
  profile_image?: string | null;
  activityStatus: ActivityStatus;
  completed_workouts_count: number;
  current_streak: number;
  personal_records_count: number;
  created_at: string;
}

export interface PendingRequestsResult {
  incoming: Friend[];
  outgoing: Friend[];
}

export interface FriendsServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
