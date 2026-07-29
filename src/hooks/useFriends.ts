import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { FriendsService } from '../services/friendsService';
import { Friend, UserSearchResult } from '../types/friends';

export interface UseFriendsProps {
  currentUser: User | null;
}

export function useFriends({ currentUser }: UseFriendsProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback' | 'checking'>('checking');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Friend Modal / Search States
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation States
  const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null);

  // Selected Friend for Profile View
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const currentUserId = currentUser?.id || 'guest';
  const currentUserEmail = currentUser?.email || '';
  const currentUserName = currentUser?.user_metadata?.full_name || currentUserEmail.split('@')[0] || 'Athlete';

  // Toast notification helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  }, []);

  // Primary Data Loader utilizing FriendsService
  const loadFriendsData = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase && currentUser) {
        setDbStatus('connected');
        // 1. Sync own profile so other users can discover us
        await FriendsService.syncOwnProfile(currentUserId, currentUserEmail, currentUserName);

        // 2. Load accepted friends via service
        const friendsRes = await FriendsService.getFriends(currentUserId);
        if (friendsRes.success && friendsRes.data) {
          setFriends(friendsRes.data);
        }

        // 3. Load pending requests via service
        const pendingRes = await FriendsService.getPendingRequests(currentUserId);
        if (pendingRes.success && pendingRes.data) {
          setIncomingRequests(pendingRes.data.incoming);
          setOutgoingRequests(pendingRes.data.outgoing);
        }
      } else {
        setDbStatus('fallback');
        // Fallback local state loading via service
        const friendsRes = await FriendsService.getFriends(currentUserId);
        if (friendsRes.data) setFriends(friendsRes.data);

        const pendingRes = await FriendsService.getPendingRequests(currentUserId);
        if (pendingRes.data) {
          setIncomingRequests(pendingRes.data.incoming);
          setOutgoingRequests(pendingRes.data.outgoing);
        }
      }
    } catch (err) {
      console.error('Error loading friends data via FriendsService:', err);
      setDbStatus('fallback');
      showToast('Offline or network issue. Loaded local friends.', 'info');
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentUserId, currentUserEmail, currentUserName, showToast]);

  useEffect(() => {
    loadFriendsData();

    // Listen for real-time updates dispatched by FriendsService
    const handleUpdate = () => {
      loadFriendsData();
    };

    window.addEventListener('reppulse_friends_updated', handleUpdate);
    return () => {
      window.removeEventListener('reppulse_friends_updated', handleUpdate);
    };
  }, [loadFriendsData]);

  // Handle user search in modal
  useEffect(() => {
    const query = friendEmail.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await FriendsService.searchUsers(query, currentUserId);
      setIsSearching(false);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [friendEmail, currentUserId]);

  const openAddSheet = useCallback(() => {
    setFriendEmail('');
    setSearchResults([]);
    setFormError(null);
    setIsSheetOpen(true);
  }, []);

  const handleAddFriend = useCallback(async (e?: React.FormEvent, targetUserEmail?: string) => {
    if (e) e.preventDefault();
    setFormError(null);

    const emailToSend = (targetUserEmail || friendEmail).trim().toLowerCase();
    if (!emailToSend) {
      setFormError('Friend email is required.');
      return;
    }

    setSubmitting(true);
    const res = await FriendsService.sendFriendRequest(emailToSend, currentUserId, currentUserEmail);
    setSubmitting(false);

    if (res.success) {
      showToast('Friend request sent!', 'success');
      setIsSheetOpen(false);
      setFriendEmail('');
      setSearchResults([]);
      loadFriendsData();
    } else {
      setFormError(res.error || 'Failed to send request. Try again.');
    }
  }, [friendEmail, currentUserId, currentUserEmail, showToast, loadFriendsData]);

  const handleAcceptRequest = useCallback(async (friendshipId: string) => {
    setActionLoading(true);
    const res = await FriendsService.acceptFriendRequest(friendshipId, currentUserId);
    setActionLoading(false);

    if (res.success) {
      showToast('Friend request accepted!', 'success');
      loadFriendsData();
    } else {
      showToast(res.error || 'Failed to accept request', 'error');
    }
  }, [currentUserId, showToast, loadFriendsData]);

  const handleDeclineRequest = useCallback(async (friendshipId: string, isIncoming: boolean) => {
    setActionLoading(true);
    const res = await FriendsService.declineFriendRequest(friendshipId, currentUserId, isIncoming);
    setActionLoading(false);

    if (res.success) {
      showToast(isIncoming ? 'Request declined' : 'Request cancelled', 'success');
      loadFriendsData();
    } else {
      showToast(res.error || 'Failed to decline request', 'error');
    }
  }, [currentUserId, showToast, loadFriendsData]);

  const handleDeleteFriend = useCallback(async () => {
    if (!friendToDelete) return;
    setActionLoading(true);
    const fsId = friendToDelete.friendshipId;

    const res = await FriendsService.removeFriend(fsId, currentUserId);
    setActionLoading(false);

    if (res.success) {
      showToast('Friend removed', 'success');
      setFriendToDelete(null);
      loadFriendsData();
    } else {
      showToast(res.error || 'Failed to remove friend', 'error');
    }
  }, [friendToDelete, currentUserId, showToast, loadFriendsData]);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    actionLoading,
    dbStatus,
    toast,
    searchQuery,
    setSearchQuery,
    isSheetOpen,
    setIsSheetOpen,
    friendEmail,
    setFriendEmail,
    searchResults,
    isSearching,
    formError,
    submitting,
    friendToDelete,
    setFriendToDelete,
    selectedFriend,
    setSelectedFriend,
    currentUserId,
    currentUserEmail,
    showToast,
    openAddSheet,
    handleAddFriend,
    handleAcceptRequest,
    handleDeclineRequest,
    handleDeleteFriend,
    loadFriendsData,
  };
}
