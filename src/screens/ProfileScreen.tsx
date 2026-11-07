import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Users,
  Settings, 
  ChevronRight, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  X,
  Upload,
  Trash2,
  Lock,
  FileText,
  Shield,
  LogOut,
  Info,
  Copy,
  Check,
  Edit2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useProfile } from '../hooks/useProfile';
import { ScreenType } from '../types';
import { Button, Input } from '../components/UI';
import { Logo } from '../components/Logo';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface UserProfile {
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

interface ProfileScreenProps {
  currentUser: SupabaseUser | null;
  onNavigate?: (screen: ScreenType) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ currentUser, onNavigate }) => {
  const {
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
  } = useProfile({ currentUser });

  useEffect(() => {
    loadProfile();

    const handleWeightUpdated = () => {
      loadProfile();
    };

    window.addEventListener('reppulse_weight_updated', handleWeightUpdated);
    return () => {
      window.removeEventListener('reppulse_weight_updated', handleWeightUpdated);
    };
  }, [currentUser]);

  // Sync own profile details to Friends screen
  const syncWithFriends = async (updated: UserProfile) => {
    if (!supabase || !currentUser) return;
    try {
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: updated.email,
        full_name: updated.full_name,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch {}
  };

  // Open Edit Sheet
  const handleOpenEdit = () => {
    setEditForm({
      full_name: profile.full_name,
      username: profile.username,
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      goal: profile.goal
    });
    setEditErrors({});
    setIsEditProfileOpen(true);
  };

  // Edit profile form validator
  const validateEditForm = () => {
    const errors: Record<string, string> = {};

    if (editForm.username) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(editForm.username)) {
        errors.username = 'Username must be 3-20 alphanumeric characters or underscores.';
      }
    }

    if (editForm.age) {
      const ageNum = parseInt(editForm.age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.age = 'Age must be a valid number between 1 and 120.';
      }
    }

    if (editForm.height) {
      const hNum = parseFloat(editForm.height);
      if (isNaN(hNum) || hNum < 50 || hNum > 250) {
        errors.height = 'Height must be a valid number between 50 and 250 cm.';
      }
    }

    if (editForm.weight) {
      const wNum = parseFloat(editForm.weight);
      if (isNaN(wNum) || wNum < 10 || wNum > 500) {
        errors.weight = 'Weight must be a valid number between 10 and 500 kg.';
      }
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEditForm()) {
      showToast('Please fix the validation errors.', 'error');
      return;
    }

    setSubmitting(true);
    const updated: UserProfile = {
      ...profile,
      full_name: editForm.full_name.trim(),
      username: editForm.username.trim(),
      age: editForm.age.trim(),
      gender: editForm.gender,
      height: editForm.height.trim(),
      weight: editForm.weight.trim(),
      goal: editForm.goal
    };

    let savedCloud = false;
    const weightChanged = updated.weight && profile.weight !== updated.weight;

    if (supabase && currentUser) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            email: profile.email,
            full_name: updated.full_name,
            username: updated.username || null,
            age: updated.age ? parseInt(updated.age) : null,
            gender: updated.gender || null,
            height: updated.height || null,
            weight: updated.weight || null,
            goal: updated.goal || null,
            updated_at: new Date().toISOString()
          });

        if (!error) {
          savedCloud = true;

          // If weight changed, insert into weight_history!
          if (weightChanged) {
            const parsedWeight = parseFloat(updated.weight);
            if (!isNaN(parsedWeight) && parsedWeight > 0) {
              const historyId = generateUUID();
              await supabase
                .from('weight_history')
                .insert({
                  id: historyId,
                  user_id: currentUser.id,
                  weight: parsedWeight,
                  created_at: new Date().toISOString()
                });
            }
          }
        } else {
          console.warn('Failed to save to cloud profiles table:', error.message);
        }
      } catch (err) {
        console.warn('Supabase save error:', err);
      }
    }

    // Always update local state & fallback localStorage
    setProfile(updated);
    try {
      localStorage.setItem(`reppulse_profile_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
    } catch {}

    // Sync state with friends table metadata so friends see correct updated names
    syncWithFriends(updated);

    if (weightChanged) {
      window.dispatchEvent(new Event('reppulse_weight_updated'));
    }

    showToast(savedCloud ? 'Profile synced to cloud successfully' : 'Profile updated locally');
    setIsEditProfileOpen(false);
    setSubmitting(false);
  };

  // Image Helper Saver
  const saveProfileImage = async (urlOrBase64: string | null) => {
    const updated = { ...profile, profile_image: urlOrBase64 };
    setProfile(updated);
    
    // Save locally
    try {
      localStorage.setItem(`reppulse_profile_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
    } catch {}

    // Save Cloud if connected
    if (dbStatus === 'connected' && supabase && currentUser) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            profile_image: urlOrBase64,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn('Could not sync avatar to cloud profiles:', err);
      }
    }
  };

  // Profile photo file uploader
  const uploadPhoto = async (file: File) => {
    if (!currentUser) return;
    setUploading(true);
    setIsImageOptionsOpen(false);

    try {
      if (supabase && !isBucketMissing) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${currentUser.id}/avatar-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('profile_images')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('profile_images')
          .getPublicUrl(data.path);

        await saveProfileImage(publicUrl);
        showToast('Profile photo updated', 'success');
      } else {
        throw new Error('Supabase Storage bucket profile_images is not configured');
      }
    } catch (err: any) {
      console.warn('Cloud storage failed. Using premium local storage fallback:', err.message || err);
      
      // Fallback: Read as base64 to store in local profiles
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await saveProfileImage(base64);
        showToast('Photo uploaded locally (Fallback active)', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadPhoto(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        uploadPhoto(file);
      } else {
        showToast('Only image files are allowed', 'error');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = async () => {
    setIsImageOptionsOpen(false);
    setUploading(true);
    await saveProfileImage(null);
    setUploading(false);
    showToast('Profile photo removed', 'success');
  };

  // Secure password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters.';
    }

    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('Please fix password issues.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({
          password: passwordForm.newPassword
        });

        if (error) {
          const msg = error.message.toLowerCase().includes('fetch')
            ? 'Network error. Could not update password.'
            : error.message;
          showToast(msg, 'error');
        } else {
          showToast('Password changed securely', 'success');
          setIsChangePasswordOpen(false);
          setPasswordForm({ newPassword: '', confirmPassword: '' });
        }
      } else {
        showToast('Supabase auth is not initialized', 'error');
      }
    } catch (err: any) {
      const msg = err?.message?.toLowerCase().includes('fetch')
        ? 'Network error. Could not update password.'
        : err?.message || 'Error updating password';
      showToast(msg, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Logout trigger
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    if (onNavigate) {
      onNavigate('login');
    }
  };

  // Initials generator
  const getInitials = () => {
    const name = profile.full_name || 'Athlete';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // SQL Script and Guides for Supabase Config
  const sqlCommand = `-- CREATE PUBLIC PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  profile_image TEXT,
  age INTEGER,
  gender TEXT,
  height TEXT,
  weight TEXT,
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES FOR SECURE ACCESS
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
    OR
    (auth.uid() IS NULL AND id IN (SELECT id FROM auth.users))
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- TRIGGER FOR AUTO-CREATING PROFILE ON USER SIGN-UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  const bucketInstructions = `1. Open your Supabase Dashboard.
2. Go to "Storage" in the left sidebar.
3. Click "New Bucket" and name it exactly: profile_images
4. Toggle "Public Bucket" to ON.
5. Save the bucket.
6. Under "Policies", click "New Policy" on the profile_images bucket.
7. Click "Allowed to upload to this bucket" and set policy check to:
   auth.uid() = (storage.foldername(name))[1]`;

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      
      {/* TOP BAR */}
      <header className="h-14 bg-white border-b border-neutral-100 flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div>
          <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase">
            Profile
          </h1>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest -mt-0.5">
            Athletic Bio & System Setup
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-150">
          <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-neutral-900' : 'bg-neutral-400'}`} />
          <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">
            {dbStatus === 'connected' ? 'Cloud Synced' : 'Local Sandbox'}
          </span>
        </div>
      </header>

      {/* SCROLLABLE VIEWPORT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 flex flex-col gap-6 pb-24">
        
        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse">
            {/* Skeletal Profile Card */}
            <div className="p-6 border border-neutral-100 rounded-3xl flex flex-col items-center justify-center text-center bg-white gap-4">
              <div className="w-20 h-20 rounded-full bg-neutral-100" />
              <div className="space-y-2 w-full flex flex-col items-center">
                <div className="h-4 bg-neutral-100 rounded w-1/3" />
                <div className="h-3 bg-neutral-50 rounded w-1/4" />
              </div>
            </div>
            {/* Skeletal Bio metrics */}
            <div className="grid grid-cols-2 gap-3.5">
              {[1, 2, 4, 5].map((n) => (
                <div key={n} className="p-4 border border-neutral-100 rounded-2xl h-18 bg-neutral-50/40" />
              ))}
            </div>
            {/* Skeletal settings rows */}
            <div className="space-y-3">
              <div className="h-3 w-1/4 bg-neutral-100 rounded" />
              {[1, 2].map((n) => (
                <div key={n} className="h-12 border border-neutral-100 rounded-2xl bg-neutral-50/40" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* PROFILE CARD */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 border rounded-3xl flex flex-col items-center justify-center text-center bg-white transition-all duration-300 relative ${
                isDragging ? 'border-dashed border-neutral-950 bg-neutral-50' : 'border-neutral-100'
              }`}
            >
              {/* Edit Bio Button */}
              <button 
                onClick={handleOpenEdit}
                className="absolute top-4 right-4 w-9 h-9 bg-neutral-50 border border-neutral-100 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 hover:border-neutral-200 active:scale-90 transition-all cursor-pointer"
                title="Edit Personal Information"
              >
                <Edit2 size={13} />
              </button>

              {/* Avatar Zone */}
              <div className="relative group mb-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                <div 
                  onClick={() => setIsImageOptionsOpen(true)}
                  className="w-20 h-20 rounded-full border border-neutral-100 bg-neutral-900 text-white flex items-center justify-center font-sans font-bold text-2xl relative overflow-hidden shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                >
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-white" />
                  ) : profile.profile_image ? (
                    <img 
                      src={profile.profile_image} 
                      alt={profile.full_name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    getInitials()
                  )}
                  
                  {/* Hover indicator overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <Upload size={16} className="text-white" />
                  </div>
                </div>
              </div>

              {isDragging && (
                <p className="text-[10px] text-neutral-900 font-bold uppercase tracking-wider mb-2">
                  Drop Image To Upload
                </p>
              )}

              {/* Athlete Bio Details */}
              <h2 className="font-sans font-bold text-lg text-neutral-900 uppercase tracking-tight leading-none">
                {profile.full_name || <span className="text-neutral-300 italic">Name Not set</span>}
              </h2>
              
              <p className="text-[10px] font-mono font-bold text-neutral-400 mt-1.5 uppercase tracking-widest">
                {profile.username ? `@${profile.username}` : <span className="text-neutral-300 italic">No username</span>}
              </p>

              <p className="text-[9px] font-sans font-medium text-neutral-400 mt-1 lowercase">
                {profile.email}
              </p>

              {/* PHYSICAL METRICS GRID */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-full mt-6 pt-5 border-t border-neutral-100 text-left">
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Age</span>
                  <span className="text-xs font-bold text-neutral-900 mt-0.5 block uppercase">
                    {profile.age ? `${profile.age} yrs` : <span className="text-neutral-300 font-normal">Not set</span>}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Gender</span>
                  <span className="text-xs font-bold text-neutral-900 mt-0.5 block uppercase">
                    {profile.gender ? profile.gender : <span className="text-neutral-300 font-normal">Not set</span>}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Height</span>
                  <span className="text-xs font-bold text-neutral-900 mt-0.5 block uppercase">
                    {profile.height ? `${profile.height} cm` : <span className="text-neutral-300 font-normal">Not set</span>}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Weight</span>
                  <span className="text-xs font-bold text-neutral-900 mt-0.5 block uppercase">
                    {profile.weight ? `${profile.weight} kg` : <span className="text-neutral-300 font-normal">Not set</span>}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Fitness Goal</span>
                  <span className="text-xs font-bold text-neutral-900 mt-0.5 block uppercase">
                    {profile.goal ? profile.goal : <span className="text-neutral-300 font-normal">Not set</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* INTEGRATION ASSISTANT ACCORDION (If Table/Bucket Missing) */}
            {(isTableMissing || isBucketMissing) && (
              <div className="border border-neutral-150 rounded-2xl bg-neutral-50 overflow-hidden">
                <button 
                  onClick={() => setShowDevGuide(!showDevGuide)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-neutral-900 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-neutral-900 uppercase tracking-wide">
                        Supabase Action Required
                      </p>
                      <p className="text-[9px] text-neutral-500 font-medium uppercase mt-0.5">
                        Setup schema or storage bucket
                      </p>
                    </div>
                  </div>
                  <ChevronRight 
                    size={14} 
                    className={`text-neutral-400 transition-transform duration-200 ${showDevGuide ? 'rotate-90' : ''}`} 
                  />
                </button>

                <AnimatePresence>
                  {showDevGuide && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-neutral-150 p-4 flex flex-col gap-4"
                    >
                      {/* SQL Instructions */}
                      {isTableMissing && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                              Run in Supabase SQL Editor:
                            </span>
                            <button 
                              onClick={() => copyToClipboard(sqlCommand, 'sql')}
                              className="text-[9px] font-bold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === 'sql' ? (
                                <>
                                  <Check size={10} /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={10} /> Copy SQL
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-[8px] font-mono text-neutral-600 bg-white p-3 border border-neutral-200 rounded-xl overflow-x-auto max-h-40 leading-relaxed whitespace-pre">
                            {sqlCommand}
                          </pre>
                        </div>
                      )}

                      {/* Bucket Instructions */}
                      {isBucketMissing && (
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                            Create "profile_images" Storage Bucket:
                          </span>
                          <div className="text-[9px] text-neutral-600 leading-relaxed font-sans bg-white p-3 border border-neutral-200 rounded-xl whitespace-pre-line">
                            {bucketInstructions}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* SETTINGS SECTION */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase pl-0.5">
                Account Configurations
              </span>
              
              <div className="flex flex-col border border-neutral-100 rounded-2xl overflow-hidden divide-y divide-neutral-100 bg-white shadow-xs">
                {/* Friends */}
                <button 
                  type="button"
                  onClick={() => onNavigate && onNavigate('friends')}
                  className="flex justify-between items-center p-4 bg-white hover:bg-neutral-50 transition-all duration-150 text-left cursor-pointer border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <Users size={14} className="text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900 tracking-wide">
                      Friends
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </button>

                {/* Change Password */}
                <button 
                  type="button"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="flex justify-between items-center p-4 bg-white hover:bg-neutral-50 transition-all duration-150 text-left cursor-pointer border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <Lock size={14} className="text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900 tracking-wide">
                      Change Password
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </button>

                {/* Privacy Policy */}
                <button 
                  type="button"
                  onClick={() => setIsPrivacyOpen(true)}
                  className="flex justify-between items-center p-4 bg-white hover:bg-neutral-50 transition-all duration-150 text-left cursor-pointer border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={14} className="text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900 tracking-wide">
                      Privacy Policy
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </button>

                {/* Terms and Conditions */}
                <button 
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="flex justify-between items-center p-4 bg-white hover:bg-neutral-50 transition-all duration-150 text-left cursor-pointer border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={14} className="text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900 tracking-wide">
                      Terms of Service
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </button>

                {/* About RepPulse */}
                <button 
                  type="button"
                  onClick={() => setIsAboutOpen(true)}
                  className="flex justify-between items-center p-4 bg-white hover:bg-neutral-50 transition-all duration-150 text-left cursor-pointer border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <Info size={14} className="text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900 tracking-wide">
                      About RepPulse
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </button>

                {/* Logout */}
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="flex justify-between items-center p-4 bg-white hover:bg-neutral-50 transition-all duration-150 text-left cursor-pointer border border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={14} className="text-danger-coral" />
                    <span className="text-xs font-bold text-danger-coral tracking-wide">
                      Log Out
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400" />
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* MODAL 1: EDIT PROFILE */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 rounded-t-[24px] shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col max-h-[90%] overflow-y-auto no-scrollbar"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                <div>
                  <h4 className="font-display font-bold text-base text-neutral-900 uppercase tracking-wide">
                    Edit Personal Info
                  </h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                    Adjust biometric data & goal configurations
                  </p>
                </div>
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-neutral-100"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="e.g. Ajay Kumar"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  error={editErrors.full_name}
                />

                <Input
                  label="Username"
                  type="text"
                  placeholder="e.g. athlete_99"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  error={editErrors.username}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Age"
                    type="number"
                    placeholder="e.g. 25"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    error={editErrors.age}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-secondary-text pl-1">
                      Gender
                    </label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="h-[52px] border border-neutral-100 rounded-2xl px-4 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Height (cm)"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 178"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                    error={editErrors.height}
                  />

                  <Input
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 74.5"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    error={editErrors.weight}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-secondary-text pl-1">
                    Fitness Goal
                  </label>
                  <select
                    value={editForm.goal}
                    onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                    className="h-[52px] border border-neutral-100 rounded-2xl px-4 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 bg-white"
                  >
                    <option value="">Select Goal</option>
                    <option value="Strength">Strength Power</option>
                    <option value="Hypertrophy">Hypertrophy (Muscle)</option>
                    <option value="Endurance">Cardio & Endurance</option>
                    <option value="General Fitness">General Fitness</option>
                    <option value="Weight Loss">Weight Loss</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
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
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 2: CHANGE PASSWORD */}
      <AnimatePresence>
        {isChangePasswordOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 rounded-t-[24px] shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                <div>
                  <h4 className="font-display font-bold text-base text-neutral-900 uppercase tracking-wide">
                    Change Password
                  </h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                    Securely update your athlete account credentials
                  </p>
                </div>
                <button
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-neutral-100"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  error={passwordErrors.newPassword}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Re-type new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  error={passwordErrors.confirmPassword}
                />

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={passwordLoading}
                    variant="primary"
                    className="flex items-center justify-center gap-1.5"
                  >
                    {passwordLoading && <Loader2 size={16} className="animate-spin" />}
                    <span>Update Password</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 3: PRIVACY POLICY */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 rounded-t-[24px] shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col max-h-[85%] overflow-hidden"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4 shrink-0">
                <div>
                  <h4 className="font-display font-bold text-base text-neutral-900 uppercase tracking-wide">
                    Privacy Policy
                  </h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                    How we safeguard your biometric data
                  </p>
                </div>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-neutral-100"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar text-neutral-600 text-[11px] leading-relaxed font-sans space-y-3.5 pr-1">
                <p className="font-bold text-neutral-900">1. Data Ownership & Transparency</p>
                <p>
                  At RepPulse, we believe you own your physical biometric telemetry. Your weight, calorie logs, workout achievements, and physical stats are saved locally inside your secure device sandbox. When synced to Supabase, they are secured via TLS/SSL connections and encrypted at rest.
                </p>
                <p className="font-bold text-neutral-900">2. No Third-Party Telemetry Commercialization</p>
                <p>
                  RepPulse does not sell, lease, or syndicate your performance statistics to health insurance providers, advertisement networks, or data brokers.
                </p>
                <p className="font-bold text-neutral-900">3. Local-First Caching</p>
                <p>
                  To maximize reliability, your training statistics are buffered inside your device's storage. If database connectivity is degraded, information remains entirely within your control.
                </p>
                <p className="font-bold text-neutral-900">4. Right to Deletion</p>
                <p>
                  You can permanently purge your training history, profile metadata, and files at any time by requesting deletion or using the Logout options.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 4: TERMS OF SERVICE */}
      <AnimatePresence>
        {isTermsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 rounded-t-[24px] shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col max-h-[85%] overflow-hidden"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4 shrink-0">
                <div>
                  <h4 className="font-display font-bold text-base text-neutral-900 uppercase tracking-wide">
                    Terms of Service
                  </h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                    Rules and responsibilities of the athlete
                  </p>
                </div>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-neutral-100"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar text-neutral-600 text-[11px] leading-relaxed font-sans space-y-3.5 pr-1">
                <p className="font-bold text-neutral-900">1. Training Safety Disclaimer</p>
                <p>
                  RepPulse provides training analytics, tracking interfaces, and local metadata storage. We do not provide licensed medical advice or professional physical training certifications. Always consult with a physician before initiating intensive resistance or high-intensity athletic programs.
                </p>
                <p className="font-bold text-neutral-900">2. Account Credential Protection</p>
                <p>
                  You are solely responsible for protecting your password. Any physical metrics stored under your account are deemed self-reported.
                </p>
                <p className="font-bold text-neutral-900">3. Community Code of Conduct</p>
                <p>
                  When connecting with friends in the Friends module, you agree not to submit offensive usernames, duplicate accounts, or fraudulent records.
                </p>
                <p className="font-bold text-neutral-900">4. Operational Availability</p>
                <p>
                  RepPulse services are provided "as is." While we utilize double-layered local caching and Supabase redundancy, we are not liable for transient sync issues.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 5: ABOUT REPPULSE */}
      <AnimatePresence>
        {isAboutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAboutOpen(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 rounded-t-[24px] shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col items-center text-center"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
              
              <div className="flex justify-end w-full mb-2 shrink-0">
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-neutral-100"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="w-32 h-32 flex items-center justify-center mb-1">
                <Logo size={90} variant="light" showText={false} />
              </div>

              <h3 className="font-display font-bold text-lg text-neutral-900 tracking-[0.2em] uppercase">
                REPPULSE
              </h3>
              
              <p className="text-[10px] font-sans font-bold tracking-[0.3em] uppercase text-neutral-400 mt-1">
                Every Rep Counts.
              </p>

              <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl w-full mt-6 text-left max-w-xs font-sans text-[10px] leading-relaxed text-neutral-600 uppercase font-bold space-y-1">
                <p className="flex justify-between">
                  <span>Version</span>
                  <span className="text-neutral-900 font-mono">1.0.0</span>
                </p>
                <p className="flex justify-between">
                  <span>Environment</span>
                  <span className="text-neutral-900 font-mono">Secured Sandbox</span>
                </p>
                <p className="flex justify-between">
                  <span>Auth Standard</span>
                  <span className="text-neutral-900 font-mono">Supabase OTP/Pass</span>
                </p>
                <p className="flex justify-between">
                  <span>Developer Team</span>
                  <span className="text-neutral-900 font-mono">RepPulse Athletics</span>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PHOTO ACTION LIST SHEET */}
      <AnimatePresence>
        {isImageOptionsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImageOptionsOpen(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 rounded-t-[24px] shadow-xl z-50 p-6 flex flex-col gap-3"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-3" />
              
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-center mb-2">
                Manage Profile Image
              </span>

              <button 
                onClick={triggerFileInput}
                className="w-full h-12 bg-neutral-950 text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-800 active:scale-95 transition-all"
              >
                <Upload size={14} />
                Upload / Replace Photo
              </button>

              {profile.profile_image && (
                <button 
                  onClick={handleRemovePhoto}
                  className="w-full h-12 bg-white text-danger-coral border border-neutral-100 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all"
                >
                  <Trash2 size={14} />
                  Remove Photo
                </button>
              )}

              <button 
                onClick={() => setIsImageOptionsOpen(false)}
                className="w-full h-12 bg-white text-neutral-500 border border-neutral-100 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center cursor-pointer hover:bg-neutral-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-6 left-4 right-4 bg-neutral-900 text-white py-3.5 px-4 rounded-xl shadow-lg border border-neutral-800 z-50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <CheckCircle size={14} className="text-white shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
