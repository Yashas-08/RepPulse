import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  ChevronLeft,
  Check,
  Clock,
  UserPlus,
  Search
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Button, Input } from '../components/UI';
import { FriendProfileView } from './FriendProfileView';
import { FriendsService } from '../services/friendsService';
import { useFriends } from '../hooks/useFriends';
import { Friend, UserSearchResult } from '../types/friends';

interface FriendsScreenProps {
  currentUser: User | null;
  onBack?: () => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ currentUser, onBack }) => {
  const {
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
  } = useFriends({ currentUser });

  if (selectedFriend) {
    return (
      <FriendProfileView
        friend={selectedFriend}
        onBack={() => setSelectedFriend(null)}
        currentUser={currentUser}
        dbStatus={dbStatus}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      
      {/* TOP APP BAR */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer mr-1 border border-border-cool"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
              Friends
            </h1>
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5">
              Stay accountable together.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-bg-snow px-2.5 py-1 rounded-full border border-border-cool">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">
            Accountability
          </span>
        </div>
      </header>

      {/* FALLBACK MODE BANNER PANEL */}
      {dbStatus === 'fallback' && (
        <div className="mx-5 mt-4 p-3 bg-neutral-50 border border-border-cool border-dashed rounded-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
              Local Storage Mode
            </span>
          </div>
          <button
            onClick={() => {
              FriendsService.sendFriendRequest('demo.athlete@reppulse.com', currentUserId, currentUserEmail);
              showToast('Demo friend request created!', 'info');
            }}
            className="px-2.5 py-1 bg-neutral-950 text-white rounded-lg text-[8px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all cursor-pointer"
          >
            Demo Request
          </button>
        </div>
      )}

      {/* SCROLLABLE VIEWPORT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 flex flex-col gap-6 pb-28">
        
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-4 w-1/3 bg-neutral-100 rounded animate-pulse mb-1" />
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 border border-neutral-100 rounded-2xl flex items-center justify-between animate-pulse bg-neutral-50/30">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-9 h-9 rounded-full bg-neutral-100 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-neutral-100 rounded w-1/3" />
                    <div className="h-2 bg-neutral-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-100" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* INCOMING REQUESTS MODULE */}
            {incomingRequests.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-0.5">
                  Incoming Requests ({incomingRequests.length})
                </span>
                <div className="flex flex-col gap-2.5">
                  {incomingRequests.map((req) => (
                    <div 
                      key={req.friendshipId}
                      className="bg-neutral-50 border border-border-cool rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 font-sans font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-neutral-300">
                          {req.profile_image ? (
                            <img 
                              src={req.profile_image} 
                              alt={req.full_name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            req.full_name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-sans font-bold text-xs text-neutral-900 truncate uppercase tracking-wide">
                            {req.full_name}
                          </h5>
                          <p className="text-[9px] text-neutral-400 truncate mt-0.5 font-semibold uppercase tracking-wider">
                            {req.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.friendshipId)}
                          disabled={actionLoading}
                          className="px-2.5 h-7 bg-neutral-950 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check size={10} />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.friendshipId, true)}
                          disabled={actionLoading}
                          className="px-2.5 h-7 bg-white border border-border-cool text-neutral-600 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X size={10} />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OUTGOING REQUESTS MODULE */}
            {outgoingRequests.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-0.5">
                  Sent Requests ({outgoingRequests.length})
                </span>
                <div className="flex flex-col gap-2.5">
                  {outgoingRequests.map((req) => (
                    <div 
                      key={req.friendshipId}
                      className="bg-white border border-border-cool border-dashed rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-50 border border-border-cool text-neutral-400 font-sans font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {req.profile_image ? (
                            <img 
                              src={req.profile_image} 
                              alt={req.full_name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            req.full_name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-sans font-bold text-xs text-neutral-500 truncate uppercase tracking-wide">
                            {req.full_name}
                          </h5>
                          <p className="text-[9px] text-neutral-450 truncate mt-0.5 font-semibold uppercase tracking-wider">
                            {req.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-neutral-400 px-2 py-1 bg-neutral-50 rounded-full border border-border-cool">
                          <Clock size={10} />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Pending</span>
                        </div>
                        <button
                          onClick={() => handleDeclineRequest(req.friendshipId, false)}
                          disabled={actionLoading}
                          className="w-7 h-7 bg-white border border-border-cool text-neutral-400 hover:text-red-600 hover:bg-red-50/50 rounded-full flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
                          title="Cancel Request"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FRIENDS MODULE */}
            {friends.length === 0 ? (
              /* EMPTY STATE: Only show if there are also no requests */
              incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 my-auto">
                  <div className="w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center mb-4 border border-border-cool">
                    <Users size={24} className="text-neutral-400" />
                  </div>
                  
                  <h3 className="font-display font-semibold text-sm text-neutral-900 uppercase tracking-wide">
                    No friends added yet.
                  </h3>
                  
                  <p className="text-sm text-neutral-500 max-w-[240px] mt-1.5 leading-relaxed font-normal">
                    Invite a friend and stay consistent together.
                  </p>

                  <Button
                    onClick={openAddSheet}
                    variant="primary"
                    className="mt-6 w-full max-w-[200px]"
                  >
                    Add Friend
                  </Button>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-4">
                {/* SEARCH BAR */}
                <div className="relative flex items-center">
                  <Search size={16} className="absolute left-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends by name or email..."
                    className="w-full h-11 bg-neutral-50 border border-neutral-150 rounded-xl pl-11 pr-4 text-xs font-medium placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:bg-white transition-all duration-150"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 text-neutral-400 hover:text-neutral-900 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {(() => {
                  const query = searchQuery.trim().toLowerCase();
                  const filtered = friends.filter(f => 
                    f.full_name.toLowerCase().includes(query) || 
                    f.email.toLowerCase().includes(query)
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center text-center py-12 bg-white border border-neutral-100 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
                          <Search size={18} className="text-neutral-400" />
                        </div>
                        <h4 className="font-display font-bold text-xs text-neutral-900 uppercase tracking-wide">
                          No search results.
                        </h4>
                        <p className="text-[11px] text-neutral-400 max-w-[200px] mt-1 font-normal">
                          Try a different keyword.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase pl-0.5">
                        Friends ({filtered.length})
                      </span>

                      <div className="flex flex-col gap-2.5">
                        {filtered.map((friend) => (
                          <div 
                            key={friend.friendshipId}
                            onClick={() => setSelectedFriend(friend)}
                            className="bg-white border border-border-cool rounded-2xl p-4 flex items-center justify-between hover:border-neutral-300 hover:shadow-2xs hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-sans font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-neutral-100 relative">
                                {friend.profile_image ? (
                                  <img 
                                    src={friend.profile_image} 
                                    alt={friend.full_name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  friend.full_name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-sans font-bold text-xs uppercase tracking-wide text-neutral-900 truncate">
                                  {friend.full_name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    friend.activityStatus === 'active_today' ? 'bg-emerald-500' :
                                    friend.activityStatus === 'active_week' ? 'bg-amber-500' : 'bg-neutral-300'
                                  }`} />
                                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                                    {friend.activityStatus === 'active_today' ? 'Active Today' :
                                     friend.activityStatus === 'active_week' ? 'Active This Week' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFriendToDelete(friend);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50/50 active:scale-90 transition-all cursor-pointer shrink-0 border border-transparent"
                              title="Remove Friend"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

      </div>

      {/* FLOATING ACTION BUTTON */}
      {!loading && (friends.length > 0 || incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <button
          onClick={openAddSheet}
          className="absolute bottom-6 right-6 w-14 h-14 bg-neutral-950 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:bg-neutral-800 transition-all cursor-pointer z-30 border border-neutral-800 animate-fade-in"
          title="Add Friend"
        >
          <Plus size={24} />
        </button>
      )}

      {/* ADD FRIEND BOTTOM SHEET MODAL WITH REALTIME USER SEARCH */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-border-cool rounded-t-[24px] shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between pb-3 border-b border-border-cool mb-4">
                <div>
                  <h4 className="font-display font-semibold text-base text-neutral-900 uppercase tracking-wide">
                    Add Friend
                  </h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                    Search users or enter email to connect
                  </p>
                </div>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-border-cool"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddFriend} className="flex flex-col gap-4">
                
                {formError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-red-100">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="relative">
                  <Input
                    label="Search Username or Email *"
                    type="text"
                    required
                    placeholder="e.g. sarah@example.com or Sarah"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                  />
                  {isSearching && (
                    <Loader2 size={16} className="animate-spin absolute right-3 top-9 text-neutral-400" />
                  )}
                </div>

                {/* SEARCH RESULTS SUGGESTIONS */}
                {searchResults.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-2 bg-neutral-50 border border-border-cool rounded-2xl">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider px-2">
                      Matching Users
                    </span>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-border-cool hover:border-neutral-300 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                            {user.profile_image ? (
                              <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              user.full_name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h6 className="text-xs font-bold text-neutral-900 truncate uppercase">{user.full_name}</h6>
                            <p className="text-[9px] text-neutral-400 truncate">{user.email}</p>
                          </div>
                        </div>

                        <div>
                          {user.isFriend ? (
                            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">Friend</span>
                          ) : user.isPendingIncoming ? (
                            <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">Incoming</span>
                          ) : user.isPendingOutgoing ? (
                            <span className="text-[8px] font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md uppercase">Sent</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddFriend(undefined, user.email)}
                              disabled={submitting}
                              className="px-2.5 py-1 bg-neutral-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
                            >
                              <UserPlus size={11} />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    onClick={() => setIsSheetOpen(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="primary"
                    className="flex items-center justify-center gap-1.5"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    <span>Send Request</span>
                  </Button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* REMOVE CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {friendToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border border-border-cool rounded-[20px] max-w-sm w-full p-5 shadow-xl flex flex-col text-center"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={18} />
                </div>

                <h3 className="font-display font-semibold text-base text-neutral-900 uppercase tracking-wide">
                  Remove Friend?
                </h3>
                
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed font-normal">
                  This will remove your connection with <span className="font-semibold text-neutral-700">"{friendToDelete.full_name}"</span>.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <Button
                    onClick={() => setFriendToDelete(null)}
                    variant="secondary"
                    className="!h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteFriend}
                    variant="danger"
                    className="!h-11"
                  >
                    Remove
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SUCCESS/INFO TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-5 left-4 right-4 bg-neutral-900 text-white py-3.5 px-4 rounded-xl shadow-lg border border-neutral-800 z-50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <CheckCircle size={14} className="text-neutral-200 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
