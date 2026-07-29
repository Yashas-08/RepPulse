import { useState, useEffect, useCallback, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  profile_image: string | null;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
}

export interface UseProfileProps {
  currentUser: SupabaseUser | null;
}

export function useProfile({ currentUser }: UseProfileProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Supabase state detection
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [isBucketMissing, setIsBucketMissing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback' | 'checking'>('checking');
  const [showDevGuide, setShowDevGuide] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Profile data states
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
    username: '',
    profile_image: null,
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal: ''
  });

  // Modal open states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isImageOptionsOpen, setIsImageOptionsOpen] = useState(false);

  // Form input states
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal: ''
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    let loadedProfile: Partial<UserProfile> | null = null;
    let tableExists = true;

    if (supabase) {
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          setIsBucketMissing(true);
        } else {
          const hasBucket = buckets?.some(b => b.name === 'profile_images');
          setIsBucketMissing(!hasBucket);
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile row missing, table exists
          } else {
            tableExists = false;
            setIsTableMissing(true);
          }
        } else if (data) {
          loadedProfile = data;
        }
      } catch (err) {
        console.error('Error connecting to Supabase profiles:', err);
        tableExists = false;
        setIsTableMissing(true);
      }
    } else {
      tableExists = false;
    }

    if (tableExists && !isTableMissing) {
      setDbStatus('connected');
    } else {
      setDbStatus('fallback');
    }

    const localProfKey = `reppulse_profile_${currentUser.id}`;
    let localData: Record<string, string> = {};
    try {
      const stored = localStorage.getItem(localProfKey);
      if (stored) localData = JSON.parse(stored);
    } catch (e) {
      console.error('Local profile parse error:', e);
    }

    const finalProfile: UserProfile = {
      id: currentUser.id,
      email: currentUser.email || '',
      full_name: loadedProfile?.full_name || localData.full_name || currentUser.user_metadata?.full_name || 'Athlete',
      username: loadedProfile?.username || localData.username || currentUser.email?.split('@')[0] || 'athlete',
      profile_image: loadedProfile?.profile_image || localData.profile_image || null,
      age: loadedProfile?.age?.toString() || localData.age || '',
      gender: loadedProfile?.gender || localData.gender || '',
      height: loadedProfile?.height?.toString() || localData.height || '',
      weight: loadedProfile?.weight?.toString() || localData.weight || '',
      goal: loadedProfile?.goal || localData.goal || 'General Fitness'
    };

    setProfile(finalProfile);
    setEditForm({
      full_name: finalProfile.full_name,
      username: finalProfile.username,
      age: finalProfile.age,
      gender: finalProfile.gender,
      height: finalProfile.height,
      weight: finalProfile.weight,
      goal: finalProfile.goal
    });

    setLoading(false);
  }, [currentUser, isTableMissing]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    loading,
    submitting,
    setSubmitting,
    uploading,
    setUploading,
    toast,
    isTableMissing,
    isBucketMissing,
    dbStatus,
    showDevGuide,
    setShowDevGuide,
    copiedText,
    profile,
    setProfile,
    isEditProfileOpen,
    setIsEditProfileOpen,
    isChangePasswordOpen,
    setIsChangePasswordOpen,
    isPrivacyOpen,
    setIsPrivacyOpen,
    isTermsOpen,
    setIsTermsOpen,
    isAboutOpen,
    setIsAboutOpen,
    isImageOptionsOpen,
    setIsImageOptionsOpen,
    editForm,
    setEditForm,
    editErrors,
    setEditErrors,
    passwordForm,
    setPasswordForm,
    passwordErrors,
    setPasswordErrors,
    passwordLoading,
    setPasswordLoading,
    isDragging,
    setIsDragging,
    fileInputRef,
    showToast,
    copyToClipboard,
    loadProfile,
  };
}
