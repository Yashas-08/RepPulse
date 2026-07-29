import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ChevronLeft, 
  Check, 
  UserPlus, 
  CheckCircle, 
  Dumbbell, 
  Calendar, 
  Trash2, 
  Mail,
  Sparkles,
  WifiOff
} from 'lucide-react';
import { ScreenType, Notification } from '../types';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NotificationsScreenProps {
  currentUser: SupabaseUser | null;
  onBack: () => void;
  onNavigate?: (screen: ScreenType) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  currentUser,
  onBack,
  onNavigate
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor connectivity
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Load and seed notifications per user
  useEffect(() => {
    const userId = currentUser?.id || 'guest';
    const localKey = `reppulse_notifications_${userId}`;
    const stored = localStorage.getItem(localKey);

    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
        setLoading(false);
      } catch (err) {
        console.error('Error parsing notifications:', err);
        seedDefaultNotifications();
      }
    } else {
      seedDefaultNotifications();
    }
  }, [currentUser]);

  const seedDefaultNotifications = () => {
    const userId = currentUser?.id || 'guest';
    const localKey = `reppulse_notifications_${userId}`;
    
    const defaults: Notification[] = [
      {
        id: 'notif-1',
        user_id: userId,
        title: 'New Friend Request',
        message: 'Yashas sent you a friend request. Connect to share and compare logs!',
        type: 'friend_request',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: 'notif-2',
        user_id: userId,
        title: 'Friend Request Accepted',
        message: 'Sarah accepted your friend request! Start encouraging each other.',
        type: 'friend_accepted',
        read: false,
        created_at: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
      },
      {
        id: 'notif-3',
        user_id: userId,
        title: 'Workout Completed',
        message: 'You crushed Lower Body Hypertrophy today. Your personal records are updated!',
        type: 'workout_completed',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        id: 'notif-4',
        user_id: userId,
        title: 'Weekly Routine Check',
        message: 'Almost there! Complete 1 more workout this week to maintain your active streak.',
        type: 'weekly_reminder',
        read: true,
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    ];

    setNotifications(defaults);
    localStorage.setItem(localKey, JSON.stringify(defaults));
    setLoading(false);
  };

  const saveNotifications = (updated: Notification[]) => {
    const userId = currentUser?.id || 'guest';
    const localKey = `reppulse_notifications_${userId}`;
    setNotifications(updated);
    localStorage.setItem(localKey, JSON.stringify(updated));

    // Dispatch a custom event to notify other screens of changed notification count
    window.dispatchEvent(new Event('reppulse_notifications_changed'));
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus size={16} className="text-neutral-900" />;
      case 'friend_accepted':
        return <CheckCircle size={16} className="text-neutral-900" />;
      case 'workout_completed':
        return <Dumbbell size={16} className="text-neutral-900" />;
      case 'weekly_reminder':
        return <Calendar size={16} className="text-neutral-900" />;
      default:
        return <Bell size={16} className="text-neutral-900" />;
    }
  };

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 6000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      const h = Math.floor(diffMins / 60);
      return `${h}h ago`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-14 bg-white border-b border-neutral-100 flex items-center justify-between px-4 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
              Notifications
            </h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest -mt-0.5">
              Updates & Alerts
            </p>
          </div>
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-[10px] font-bold text-neutral-900 hover:text-neutral-600 transition-all uppercase tracking-wider bg-neutral-50 border border-neutral-150 px-2.5 py-1.5 rounded-lg active:scale-95 cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </header>

      {/* OFFLINE BANNER */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-neutral-950 text-white px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-2">
              <WifiOff size={12} className="text-white shrink-0" />
              <span>You are offline. Some features may be unavailable.</span>
            </div>
            <span className="text-[8px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
              Offline Mode
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION STREAM */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 pb-24">
        {loading ? (
          <div className="flex flex-col gap-4 py-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 border border-neutral-100 rounded-2xl animate-pulse flex gap-4">
                <div className="w-9 h-9 rounded-full bg-neutral-100 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2.5 bg-neutral-100 rounded w-1/3" />
                  <div className="h-2 bg-neutral-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mb-4">
              <Bell size={20} className="text-neutral-300" />
            </div>
            <h3 className="font-display font-semibold text-base text-neutral-900 uppercase tracking-wide">
              All caught up
            </h3>
            <p className="text-xs text-neutral-500 max-w-[240px] mt-1 leading-normal font-normal">
              No new alerts or fitness updates are waiting for your review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`p-4 border rounded-2xl transition-all duration-200 relative flex gap-4 ${
                    notif.read 
                      ? 'bg-white border-neutral-100 opacity-75' 
                      : 'bg-neutral-50/50 border-neutral-200 shadow-xs'
                  }`}
                >
                  {/* Avatar/Icon Circle */}
                  <div className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0 relative shadow-2xs">
                    {getIcon(notif.type)}
                    {!notif.read && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-neutral-900 border border-white rounded-full animate-pulse" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[8px] font-mono font-bold text-neutral-400 shrink-0 uppercase">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-normal leading-normal">
                      {notif.message}
                    </p>

                    {/* Quick Interactive Actions */}
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[9px] font-bold text-neutral-900 hover:text-neutral-600 uppercase tracking-widest mt-2 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Check size={10} /> Mark read
                      </button>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="absolute top-4 right-4 text-neutral-300 hover:text-neutral-900 transition-colors cursor-pointer"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
};
