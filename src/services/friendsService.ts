import { supabase } from '../lib/supabase';
import { 
  Friend, 
  FriendProfile, 
  UserSearchResult, 
  PendingRequestsResult, 
  FriendsServiceResult,
  ActivityStatus 
} from '../types/friends';
import { Workout, Meal } from '../types';

/**
 * Calculates activity status based on completed workouts list.
 */
export const calculateActivityStatus = (
  workouts: { created_at: string; completed: boolean }[]
): ActivityStatus => {
  const completedWorkouts = workouts.filter(w => w.completed);
  if (completedWorkouts.length === 0) return 'inactive';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  let hasWorkoutToday = false;
  let hasWorkoutThisWeek = false;

  for (const w of completedWorkouts) {
    const wDate = new Date(w.created_at);
    if (wDate >= today) {
      hasWorkoutToday = true;
    }
    if (wDate >= sevenDaysAgo) {
      hasWorkoutThisWeek = true;
    }
  }

  if (hasWorkoutToday) return 'active_today';
  if (hasWorkoutThisWeek) return 'active_week';
  return 'inactive';
};

/**
 * Calculate current workout streak for a user
 */
export const calculateStreak = (workoutRecords: Workout[]): number => {
  const completedWorkouts = workoutRecords.filter(w => w.completed);
  if (completedWorkouts.length === 0) return 0;

  const uniqueDates = Array.from(new Set(
    completedWorkouts.map(w => {
      const d = new Date(w.completed_at || w.updated_at || w.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  )).sort((a, b) => b.localeCompare(a)); // Descending

  if (uniqueDates.length === 0) return 0;

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const mostRecent = uniqueDates[0];

  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  let currentStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const d1 = new Date(uniqueDates[i - 1]);
    const d2 = new Date(uniqueDates[i]);
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
};

// Dispatch custom event to update UI across components
const notifyFriendsUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reppulse_friends_updated'));
  }
};

// Local storage fallback helpers
const getFallbackKey = (type: 'accepted' | 'incoming' | 'outgoing', userId: string) => 
  `reppulse_friends_${type}_v3_${userId}`;

const getFallbackData = (type: 'accepted' | 'incoming' | 'outgoing', userId: string): Friend[] => {
  try {
    const raw = localStorage.getItem(getFallbackKey(type, userId));
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const saveFallbackData = (
  userId: string,
  accepted: Friend[],
  incoming: Friend[],
  outgoing: Friend[]
) => {
  try {
    localStorage.setItem(getFallbackKey('accepted', userId), JSON.stringify(accepted));
    localStorage.setItem(getFallbackKey('incoming', userId), JSON.stringify(incoming));
    localStorage.setItem(getFallbackKey('outgoing', userId), JSON.stringify(outgoing));
  } catch (err) {
    console.error('Failed to save fallback friends data:', err);
  }
};

export const FriendsService = {
  /**
   * Sync current user's profile to Supabase `profiles` table so others can find them by email/name.
   */
  async syncOwnProfile(userId: string, email: string, fullName?: string): Promise<void> {
    if (!supabase || !userId) return;
    try {
      const nameToSave = fullName || email.split('@')[0] || 'Athlete';
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email.toLowerCase(),
          full_name: nameToSave,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Profile sync warning:', err);
    }
  },

  /**
   * Helper function to fetch all completed workouts for a given user using the
   * schema: 'workout_sessions', 'workout_exercises', and 'workout_sets'.
   */
  async fetchUserCompletedWorkouts(userId: string): Promise<Workout[]> {
    if (!supabase || !userId) {
      const local = localStorage.getItem(`reppulse_workout_sessions_${userId}`) || localStorage.getItem(`reppulse_workouts_${userId}`);
      if (local) {
        try {
          const parsed: Workout[] = JSON.parse(local);
          return parsed.filter(w => w.completed);
        } catch (_) {}
      }
      return [];
    }

    const workoutsList: Workout[] = [];
    const processedIds = new Set<string>();

    try {
      // Query 'workout_sessions' table with exercises and sets
      const { data: sData } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          workout_name,
          category,
          started_at,
          ended_at,
          duration_seconds,
          status,
          created_at,
          workout_exercises (
            id,
            exercise_name,
            workout_sets (
              id,
              weight,
              reps,
              completed
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (sData && sData.length > 0) {
        sData.forEach((s: any) => {
          if (!processedIds.has(s.id)) {
            processedIds.add(s.id);
            let totalSets = 0;
            let totalReps = 0;
            let maxWeight = 0;
            let mainExerciseName = s.workout_name || s.category || 'Workout Session';

            if (s.workout_exercises && s.workout_exercises.length > 0) {
              if (s.workout_exercises[0]?.exercise_name) {
                mainExerciseName = `${s.workout_name || 'Workout'} (${s.workout_exercises[0].exercise_name})`;
              }
              s.workout_exercises.forEach((ex: any) => {
                if (ex.workout_sets) {
                  ex.workout_sets.forEach((st: any) => {
                    totalSets++;
                    totalReps += Number(st.reps || 0);
                    if (Number(st.weight) > maxWeight) maxWeight = Number(st.weight);
                  });
                }
              });
            }

            workoutsList.push({
              id: s.id,
              user_id: s.user_id,
              exercise_name: mainExerciseName,
              sets: totalSets,
              reps: totalReps,
              weight: maxWeight,
              notes: s.category ? `Category: ${s.category}` : '',
              completed: true,
              created_at: s.created_at || s.started_at || new Date().toISOString(),
              updated_at: s.ended_at || s.created_at || new Date().toISOString(),
              completed_at: s.ended_at || s.created_at || new Date().toISOString()
            });
          }
        });
      }

      // Fallback check on localStorage for offline / guest data completeness
      const local = localStorage.getItem(`reppulse_workout_sessions_${userId}`) || localStorage.getItem(`reppulse_workouts_${userId}`);
      if (local) {
        try {
          const parsed: Workout[] = JSON.parse(local);
          parsed.forEach(w => {
            if (w.completed && !processedIds.has(w.id)) {
              processedIds.add(w.id);
              workoutsList.push(w);
            }
          });
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Error fetching completed workouts for friend:', err);
    }

    return workoutsList.sort((a, b) => {
      const tA = new Date(a.completed_at || a.created_at).getTime();
      const tB = new Date(b.completed_at || b.created_at).getTime();
      return tB - tA;
    });
  },

  /**
   * Search for authenticated users by username, display name, or email.
   * Excludes current user and marks whether they are already a friend or pending.
   */
  async searchUsers(query: string, currentUserId: string): Promise<FriendsServiceResult<UserSearchResult[]>> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { success: true, data: [] };
    }

    if (!supabase || !currentUserId) {
      // Local fallback search simulation
      const incoming = getFallbackData('incoming', currentUserId);
      const outgoing = getFallbackData('outgoing', currentUserId);
      const accepted = getFallbackData('accepted', currentUserId);

      const mockUsers: UserSearchResult[] = [
        {
          id: 'user_emma',
          email: 'emma.coach@reppulse.com',
          full_name: 'Emma Coach',
          isFriend: accepted.some(f => f.email === 'emma.coach@reppulse.com'),
          isPendingIncoming: incoming.some(f => f.email === 'emma.coach@reppulse.com'),
          isPendingOutgoing: outgoing.some(f => f.email === 'emma.coach@reppulse.com'),
        },
        {
          id: 'user_jake',
          email: 'jake.lift@reppulse.com',
          full_name: 'Jake Lift',
          isFriend: accepted.some(f => f.email === 'jake.lift@reppulse.com'),
          isPendingIncoming: incoming.some(f => f.email === 'jake.lift@reppulse.com'),
          isPendingOutgoing: outgoing.some(f => f.email === 'jake.lift@reppulse.com'),
        },
        {
          id: 'user_clara',
          email: 'clara.run@reppulse.com',
          full_name: 'Clara Run',
          isFriend: accepted.some(f => f.email === 'clara.run@reppulse.com'),
          isPendingIncoming: incoming.some(f => f.email === 'clara.run@reppulse.com'),
          isPendingOutgoing: outgoing.some(f => f.email === 'clara.run@reppulse.com'),
        }
      ].filter(u => u.email.includes(trimmed) || u.full_name.toLowerCase().includes(trimmed));

      return { success: true, data: mockUsers };
    }

    try {
      // Fetch friends and requests to know relationship status
      const { data: friendships } = await supabase
        .from('friends')
        .select('*')
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      const friendStatusMap = new Map<string, { status: string; isRequester: boolean }>();
      (friendships || []).forEach(f => {
        const otherId = f.requester_id === currentUserId ? f.receiver_id : f.requester_id;
        friendStatusMap.set(otherId, { status: f.status, isRequester: f.requester_id === currentUserId });
      });

      // Query profiles by email or full_name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, profile_image')
        .neq('id', currentUserId)
        .or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .limit(20);

      if (error) throw error;

      const results: UserSearchResult[] = (profiles || []).map(p => {
        const rel = friendStatusMap.get(p.id);
        return {
          id: p.id,
          email: p.email || '',
          full_name: p.full_name || p.email || 'Athlete',
          profile_image: p.profile_image || null,
          isFriend: rel?.status === 'accepted',
          isPendingIncoming: rel?.status === 'pending' && !rel.isRequester,
          isPendingOutgoing: rel?.status === 'pending' && rel.isRequester,
        };
      });

      return { success: true, data: results };
    } catch (err: any) {
      console.error('FriendsService searchUsers error:', err);
      return { success: false, error: err.message || 'Failed to search users.' };
    }
  },

  /**
   * Send a friend request to a user by email or user ID.
   */
  async sendFriendRequest(
    targetEmailOrId: string, 
    currentUserId: string,
    currentUserEmail?: string
  ): Promise<FriendsServiceResult<{ friendshipId: string; friend: Friend }>> {
    const input = targetEmailOrId.trim().toLowerCase();
    if (!input) {
      return { success: false, error: 'Friend email or ID is required.' };
    }

    if (currentUserEmail && input === currentUserEmail.toLowerCase()) {
      return { success: false, error: 'You cannot add yourself as a friend.' };
    }

    if (!supabase || !currentUserId) {
      // Fallback local storage execution
      const accepted = getFallbackData('accepted', currentUserId);
      const incoming = getFallbackData('incoming', currentUserId);
      const outgoing = getFallbackData('outgoing', currentUserId);

      if (accepted.some(f => f.email.toLowerCase() === input)) {
        return { success: false, error: 'You are already friends with this user.' };
      }
      if (incoming.some(f => f.email.toLowerCase() === input)) {
        return { success: false, error: 'This user has already sent you a request.' };
      }
      if (outgoing.some(f => f.email.toLowerCase() === input)) {
        return { success: false, error: 'You have already sent a friend request to this email.' };
      }

      const mockId = 'friend_' + Math.random().toString(36).substring(2, 11);
      const emailPrefix = input.split('@')[0];
      const name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      
      const newFriend: Friend = {
        friendshipId: 'fs_' + Math.random().toString(36).substring(2, 11),
        friendId: mockId,
        email: input,
        full_name: name,
        activityStatus: 'inactive',
        created_at: new Date().toISOString(),
        accepted_at: null
      };

      const updatedOutgoing = [newFriend, ...outgoing];
      saveFallbackData(currentUserId, accepted, incoming, updatedOutgoing);
      notifyFriendsUpdated();

      return { success: true, data: { friendshipId: newFriend.friendshipId, friend: newFriend } };
    }

    try {
      // 1. Find profile by email or ID
      let profile = null;
      
      // Try ID first if input matches UUID format
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
      if (isUuid) {
        const { data: pById } = await supabase
          .from('profiles')
          .select('id, email, full_name, profile_image')
          .eq('id', input)
          .maybeSingle();
        profile = pById;
      }

      if (!profile) {
        const { data: pByEmail, error: pErr } = await supabase
          .from('profiles')
          .select('id, email, full_name, profile_image')
          .eq('email', input)
          .maybeSingle();

        if (pErr) throw pErr;
        profile = pByEmail;
      }

      if (!profile) {
        return { success: false, error: 'No user found with this email. Verify they are registered.' };
      }

      if (profile.id === currentUserId) {
        return { success: false, error: 'You cannot add yourself as a friend.' };
      }

      const friendUserId = profile.id;

      // 2. Check existing relationship
      const { data: existing, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${friendUserId}),and(requester_id.eq.${friendUserId},receiver_id.eq.${currentUserId})`)
        .maybeSingle();

      if (checkError) {
        console.warn('Friendship check query notice:', checkError);
      }

      if (existing) {
        if (existing.status === 'accepted') {
          return { success: false, error: 'You are already friends with this user.' };
        } else if (existing.requester_id === currentUserId && existing.status === 'pending') {
          return { success: false, error: 'You have already sent a friend request to this user.' };
        } else if (existing.receiver_id === currentUserId && existing.status === 'pending') {
          return { success: false, error: 'This user has already sent you a request. Check incoming requests!' };
        }
      }

      // 3. Insert friendship row
      const { data: inserted, error: insertError } = await supabase
        .from('friends')
        .insert({
          requester_id: currentUserId,
          receiver_id: friendUserId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const createdFriend: Friend = {
        friendshipId: inserted?.id || 'fs_' + Math.random().toString(36).substring(2, 9),
        friendId: friendUserId,
        email: profile.email || input,
        full_name: profile.full_name || profile.email || 'Athlete',
        activityStatus: 'inactive',
        created_at: inserted?.created_at || new Date().toISOString(),
        accepted_at: null,
        profile_image: profile.profile_image || null
      };

      notifyFriendsUpdated();
      return { success: true, data: { friendshipId: createdFriend.friendshipId, friend: createdFriend } };
    } catch (err: any) {
      console.error('FriendsService sendFriendRequest error:', err);
      return { success: false, error: err.message || 'Failed to send friend request.' };
    }
  },

  /**
   * Get incoming and outgoing pending friend requests.
   */
  async getPendingRequests(currentUserId: string): Promise<FriendsServiceResult<PendingRequestsResult>> {
    if (!supabase || !currentUserId) {
      const incoming = getFallbackData('incoming', currentUserId);
      const outgoing = getFallbackData('outgoing', currentUserId);
      return { success: true, data: { incoming, outgoing } };
    }

    try {
      const { data: pendingRows, error: pendingErr } = await supabase
        .from('friends')
        .select('*')
        .eq('status', 'pending')
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (pendingErr) throw pendingErr;

      if (!pendingRows || pendingRows.length === 0) {
        return { success: true, data: { incoming: [], outgoing: [] } };
      }

      const otherUserIds = pendingRows.map(r => 
        r.requester_id === currentUserId ? r.receiver_id : r.requester_id
      );
      const uniqueOtherIds = [...new Set(otherUserIds)];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, profile_image')
        .in('id', uniqueOtherIds);

      const profilesMap = new Map<string, { email: string; full_name: string; profile_image: string | null }>();
      (profiles || []).forEach(p => {
        profilesMap.set(p.id, {
          email: p.email || '',
          full_name: p.full_name || p.email || 'Athlete',
          profile_image: p.profile_image || null
        });
      });

      const incoming: Friend[] = [];
      const outgoing: Friend[] = [];

      pendingRows.forEach(row => {
        const friendId = row.requester_id === currentUserId ? row.receiver_id : row.requester_id;
        const profile = profilesMap.get(friendId) || {
          email: 'unknown@reppulse.com',
          full_name: 'Athlete',
          profile_image: null
        };

        const item: Friend = {
          friendshipId: row.id,
          friendId,
          email: profile.email,
          full_name: profile.full_name,
          activityStatus: 'inactive',
          created_at: row.created_at,
          accepted_at: null,
          profile_image: profile.profile_image
        };

        if (row.receiver_id === currentUserId) {
          incoming.push(item);
        } else {
          outgoing.push(item);
        }
      });

      return { success: true, data: { incoming, outgoing } };
    } catch (err: any) {
      console.error('FriendsService getPendingRequests error:', err);
      // Fall back to local storage if query fails
      const incoming = getFallbackData('incoming', currentUserId);
      const outgoing = getFallbackData('outgoing', currentUserId);
      return { success: true, data: { incoming, outgoing } };
    }
  },

  /**
   * Accept an incoming friend request.
   */
  async acceptFriendRequest(friendshipId: string, currentUserId: string): Promise<FriendsServiceResult<boolean>> {
    if (!supabase || !currentUserId) {
      const accepted = getFallbackData('accepted', currentUserId);
      const incoming = getFallbackData('incoming', currentUserId);
      const outgoing = getFallbackData('outgoing', currentUserId);

      const match = incoming.find(r => r.friendshipId === friendshipId);
      if (match) {
        const acceptedObj: Friend = {
          ...match,
          accepted_at: new Date().toISOString(),
          activityStatus: 'inactive'
        };
        const updatedAccepted = [acceptedObj, ...accepted];
        const updatedIncoming = incoming.filter(r => r.friendshipId !== friendshipId);
        saveFallbackData(currentUserId, updatedAccepted, updatedIncoming, outgoing);
        notifyFriendsUpdated();
      }
      return { success: true, data: true };
    }

    try {
      const { error } = await supabase
        .from('friends')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', friendshipId);

      if (error) throw error;

      notifyFriendsUpdated();
      return { success: true, data: true };
    } catch (err: any) {
      console.error('FriendsService acceptFriendRequest error:', err);
      return { success: false, error: err.message || 'Failed to accept friend request.' };
    }
  },

  /**
   * Decline or cancel a friend request.
   */
  async declineFriendRequest(
    friendshipId: string, 
    currentUserId: string,
    isIncoming = true
  ): Promise<FriendsServiceResult<boolean>> {
    if (!supabase || !currentUserId) {
      const accepted = getFallbackData('accepted', currentUserId);
      const incoming = getFallbackData('incoming', currentUserId);
      const outgoing = getFallbackData('outgoing', currentUserId);

      if (isIncoming) {
        const updatedIncoming = incoming.filter(r => r.friendshipId !== friendshipId);
        saveFallbackData(currentUserId, accepted, updatedIncoming, outgoing);
      } else {
        const updatedOutgoing = outgoing.filter(r => r.friendshipId !== friendshipId);
        saveFallbackData(currentUserId, accepted, incoming, updatedOutgoing);
      }
      notifyFriendsUpdated();
      return { success: true, data: true };
    }

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      notifyFriendsUpdated();
      return { success: true, data: true };
    } catch (err: any) {
      console.error('FriendsService declineFriendRequest error:', err);
      return { success: false, error: err.message || 'Failed to decline request.' };
    }
  },

  /**
   * Get all accepted friends for current user.
   */
  async getFriends(currentUserId: string): Promise<FriendsServiceResult<Friend[]>> {
    if (!supabase || !currentUserId) {
      const accepted = getFallbackData('accepted', currentUserId);
      return { success: true, data: accepted };
    }

    try {
      // Fetch accepted friendships
      const { data: friendships, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (friendsError) throw friendsError;

      if (!friendships || friendships.length === 0) {
        return { success: true, data: [] };
      }

      const otherUserIds = friendships.map(f => 
        f.requester_id === currentUserId ? f.receiver_id : f.requester_id
      );
      const uniqueOtherIds = [...new Set(otherUserIds)];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, profile_image')
        .in('id', uniqueOtherIds);

      const profilesMap = new Map<string, { email: string; full_name: string; profile_image: string | null }>();
      (profiles || []).forEach(p => {
        profilesMap.set(p.id, {
          email: p.email || '',
          full_name: p.full_name || p.email || 'Athlete',
          profile_image: p.profile_image || null
        });
      });

      // Fetch workout data for each friend in parallel
      const resultList: Friend[] = await Promise.all(
        friendships.map(async (f) => {
          const friendId = f.requester_id === currentUserId ? f.receiver_id : f.requester_id;
          const profile = profilesMap.get(friendId) || {
            email: 'unknown@reppulse.com',
            full_name: 'Athlete',
            profile_image: null,
          };

          const friendWorkouts = await FriendsService.fetchUserCompletedWorkouts(friendId);
          const activityStatus = calculateActivityStatus(friendWorkouts);
          const streak = calculateStreak(friendWorkouts);

          return {
            friendshipId: f.id,
            friendId,
            email: profile.email,
            full_name: profile.full_name,
            activityStatus,
            created_at: f.created_at,
            accepted_at: f.accepted_at,
            profile_image: profile.profile_image,
            workout_streak: streak,
            completed_workouts_count: friendWorkouts.length,
          };
        })
      );

      return { success: true, data: resultList };
    } catch (err: any) {
      console.error('FriendsService getFriends error:', err);
      // Fallback to local storage
      const accepted = getFallbackData('accepted', currentUserId);
      return { success: true, data: accepted };
    }
  },

  /**
   * Remove a friend connection.
   */
  async removeFriend(friendshipId: string, currentUserId: string): Promise<FriendsServiceResult<boolean>> {
    if (!supabase || !currentUserId) {
      const accepted = getFallbackData('accepted', currentUserId);
      const incoming = getFallbackData('incoming', currentUserId);
      const outgoing = getFallbackData('outgoing', currentUserId);

      const updatedAccepted = accepted.filter(f => f.friendshipId !== friendshipId);
      saveFallbackData(currentUserId, updatedAccepted, incoming, outgoing);
      notifyFriendsUpdated();
      return { success: true, data: true };
    }

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      notifyFriendsUpdated();
      return { success: true, data: true };
    } catch (err: any) {
      console.error('FriendsService removeFriend error:', err);
      return { success: false, error: err.message || 'Failed to remove friend.' };
    }
  },

  /**
   * Get public profile data for a friend.
   * Ensures private user data (e.g. auth tokens, settings, internal emails) is never exposed.
   */
  async getFriendProfile(
    friendId: string, 
    currentUserId: string
  ): Promise<FriendsServiceResult<{ profile: FriendProfile; workouts: Workout[]; meals: Meal[] }>> {
    if (!supabase || !currentUserId) {
      // Local fallback calculation
      const profileLocal = localStorage.getItem(`reppulse_profile_${friendId}`);
      let full_name = 'Athlete';
      let profile_image: string | null = null;
      if (profileLocal) {
        try {
          const parsed = JSON.parse(profileLocal);
          if (parsed.full_name) full_name = parsed.full_name;
          if (parsed.profile_image) profile_image = parsed.profile_image;
        } catch (_) {}
      }

      const workoutsLocal = localStorage.getItem(`reppulse_workouts_${friendId}`);
      const workouts: Workout[] = workoutsLocal ? JSON.parse(workoutsLocal) : [];
      const completedWorkouts = workouts.filter(w => w.completed);
      const streak = calculateStreak(workouts);
      const activityStatus = calculateActivityStatus(completedWorkouts);

      const mealsLocal = localStorage.getItem(`reppulse_meals_${friendId}`);
      const meals: Meal[] = mealsLocal ? JSON.parse(mealsLocal) : [];

      const profile: FriendProfile = {
        friendId,
        email: 'friend@reppulse.com',
        full_name,
        profile_image,
        activityStatus,
        completed_workouts_count: completedWorkouts.length,
        current_streak: streak,
        personal_records_count: 0,
        created_at: new Date().toISOString()
      };

      return { success: true, data: { profile, workouts: completedWorkouts, meals } };
    }

    try {
      // Fetch friend profile, workouts, PRs, and meals concurrently
      const [
        { data: profileData },
        completedWorkouts,
        { count: prCount },
        { data: mealsData }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, profile_image, email, created_at')
          .eq('id', friendId)
          .maybeSingle(),
        FriendsService.fetchUserCompletedWorkouts(friendId),
        supabase
          .from('personal_records')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', friendId),
        supabase
          .from('meals')
          .select('*')
          .eq('user_id', friendId)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      const streak = calculateStreak(completedWorkouts);
      const activityStatus = calculateActivityStatus(completedWorkouts);

      const mealsList: Meal[] = (mealsData || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        meal_type: m.meal_type || 'Breakfast',
        meal_name: m.meal_name || m.food_name || m.name || 'Logged Meal',
        food_name: m.food_name || m.meal_name || m.name || 'Logged Meal',
        calories: Number(m.calories) || 0,
        protein: Number(m.protein || m.protein_g) || 0,
        carbohydrates: Number(m.carbohydrates || m.carbs_g) || 0,
        fat: Number(m.fat || m.fat_g) || 0,
        fiber: Number(m.fiber) || 0,
        quantity: m.quantity || '1 serving',
        meal_time: m.meal_time || m.logged_date || m.created_at || new Date().toISOString(),
        notes: m.notes || '',
        created_at: m.created_at || new Date().toISOString()
      }));

      const profile: FriendProfile = {
        friendId,
        email: profileData?.email || '',
        full_name: profileData?.full_name || profileData?.email || 'Athlete',
        profile_image: profileData?.profile_image || null,
        activityStatus,
        completed_workouts_count: completedWorkouts.length,
        current_streak: streak,
        personal_records_count: typeof prCount === 'number' ? prCount : Math.min(completedWorkouts.length, 12),
        created_at: profileData?.created_at || new Date().toISOString()
      };

      return { success: true, data: { profile, workouts: completedWorkouts, meals: mealsList } };
    } catch (err: any) {
      console.error('FriendsService getFriendProfile error:', err);
      return { success: false, error: err.message || 'Failed to load friend profile.' };
    }
  }
};
