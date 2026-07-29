import { useState, useEffect, useMemo, useCallback, ChangeEvent, FormEvent } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Workout } from '../types';
import { ProgressLog } from '../types/progress';
import { ProgressService } from '../services/progressService';

export interface UseProgressScreenProps {
  currentUser: User | null;
}

export function useProgressScreen({ currentUser }: UseProgressScreenProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [profileWeight, setProfileWeight] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback' | 'checking'>('checking');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ProgressLog | null>(null);
  const [confirmDeleteLog, setConfirmDeleteLog] = useState<ProgressLog | null>(null);
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Form Fields
  const [inputWeight, setInputWeight] = useState('');
  const [inputBodyFat, setInputBodyFat] = useState('');
  const [inputHeight, setInputHeight] = useState('');
  const [inputChest, setInputChest] = useState('');
  const [inputWaist, setInputWaist] = useState('');
  const [inputHips, setInputHips] = useState('');
  const [inputLeftArm, setInputLeftArm] = useState('');
  const [inputRightArm, setInputRightArm] = useState('');
  const [inputLeftThigh, setInputLeftThigh] = useState('');
  const [inputRightThigh, setInputRightThigh] = useState('');
  const [inputLeftCalf, setInputLeftCalf] = useState('');
  const [inputRightCalf, setInputRightCalf] = useState('');
  const [inputNeck, setInputNeck] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [inputRecordedAt, setInputRecordedAt] = useState('');

  // Photo State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submitting States
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const userId = currentUser?.id || 'guest';

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  }, []);

  // Load user workouts & progress data
  const loadUserData = useCallback(async () => {
    setLoading(true);
    let workoutsSuccess = false;

    // 1. Fetch completed workouts
    if (supabase && currentUser) {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('completed', true)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setWorkouts(data as Workout[]);
          workoutsSuccess = true;
          setDbStatus('connected');
        }
      } catch (err) {
        console.error('Error fetching workouts for progress:', err);
      }
    }

    if (!workoutsSuccess) {
      setDbStatus('fallback');
      try {
        const localData = localStorage.getItem(`reppulse_workouts_${userId}`);
        if (localData) {
          const parsed = JSON.parse(localData) as Workout[];
          const completedOnly = parsed.filter(w => w.completed);
          completedOnly.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setWorkouts(completedOnly);
        } else {
          setWorkouts([]);
        }
      } catch (err) {
        console.error('Error loading local workouts for progress:', err);
      }
    }

    // 2. Fetch current profile weight
    if (supabase && currentUser) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('weight')
          .eq('id', currentUser.id)
          .single();

        if (data && data.weight) {
          setProfileWeight(data.weight);
        }
      } catch (err) {
        console.error('Error loading profile weight:', err);
      }
    }

    // 3. Fetch progress history using ProgressService
    const res = await ProgressService.getProgressHistory(userId);
    if (res.success && res.data) {
      setProgressLogs(res.data);
    } else {
      setProgressLogs([]);
      if (res.error) showToast(res.error, 'error');
    }

    setLoading(false);
  }, [currentUser, userId, showToast]);

  useEffect(() => {
    loadUserData();

    const handleProgressUpdated = () => {
      loadUserData();
    };

    window.addEventListener('reppulse_progress_updated', handleProgressUpdated);
    window.addEventListener('reppulse_weight_updated', handleProgressUpdated);
    return () => {
      window.removeEventListener('reppulse_progress_updated', handleProgressUpdated);
      window.removeEventListener('reppulse_weight_updated', handleProgressUpdated);
    };
  }, [loadUserData]);

  // Photo Selection Handler
  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Photo size must be less than 10MB.');
        return;
      }
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const resetForm = () => {
    setInputWeight('');
    setInputBodyFat('');
    setInputHeight('');
    setInputChest('');
    setInputWaist('');
    setInputHips('');
    setInputLeftArm('');
    setInputRightArm('');
    setInputLeftThigh('');
    setInputRightThigh('');
    setInputLeftCalf('');
    setInputRightCalf('');
    setInputNeck('');
    setInputNotes('');
    setInputRecordedAt(new Date().toISOString().split('T')[0]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError(null);
    setEditingLog(null);
    setShowMeasurements(false);
  };

  const openAddModal = () => {
    resetForm();
    if (profileWeight && !inputWeight) {
      setInputWeight(profileWeight);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (log: ProgressLog) => {
    resetForm();
    setEditingLog(log);
    setInputWeight(log.weight !== null && log.weight !== undefined ? String(log.weight) : '');
    setInputBodyFat(log.body_fat_percentage !== null && log.body_fat_percentage !== undefined ? String(log.body_fat_percentage) : '');
    setInputHeight(log.height !== null && log.height !== undefined ? String(log.height) : '');
    setInputChest(log.chest !== null && log.chest !== undefined ? String(log.chest) : '');
    setInputWaist(log.waist !== null && log.waist !== undefined ? String(log.waist) : '');
    setInputHips(log.hips !== null && log.hips !== undefined ? String(log.hips) : '');
    setInputLeftArm(log.left_arm !== null && log.left_arm !== undefined ? String(log.left_arm) : '');
    setInputRightArm(log.right_arm !== null && log.right_arm !== undefined ? String(log.right_arm) : '');
    setInputLeftThigh(log.left_thigh !== null && log.left_thigh !== undefined ? String(log.left_thigh) : '');
    setInputRightThigh(log.right_thigh !== null && log.right_thigh !== undefined ? String(log.right_thigh) : '');
    setInputLeftCalf(log.left_calf !== null && log.left_calf !== undefined ? String(log.left_calf) : '');
    setInputRightCalf(log.right_calf !== null && log.right_calf !== undefined ? String(log.right_calf) : '');
    setInputNeck(log.neck !== null && log.neck !== undefined ? String(log.neck) : '');
    setInputNotes(log.notes || '');

    const logDate = log.recorded_at ? log.recorded_at.split('T')[0] : new Date().toISOString().split('T')[0];
    setInputRecordedAt(logDate);

    if (log.progress_photo_url) {
      setPhotoPreview(log.progress_photo_url);
    }

    const hasMeasurements = !!(
      log.chest || log.waist || log.hips || log.left_arm || log.right_arm ||
      log.left_thigh || log.right_thigh || log.left_calf || log.right_calf || log.neck || log.height
    );
    setShowMeasurements(hasMeasurements);

    setIsModalOpen(true);
  };

  const handleSaveProgress = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const weightNum = inputWeight.trim() ? parseFloat(inputWeight) : null;
    const bodyFatNum = inputBodyFat.trim() ? parseFloat(inputBodyFat) : null;
    const heightNum = inputHeight.trim() ? parseFloat(inputHeight) : null;
    const chestNum = inputChest.trim() ? parseFloat(inputChest) : null;
    const waistNum = inputWaist.trim() ? parseFloat(inputWaist) : null;
    const hipsNum = inputHips.trim() ? parseFloat(inputHips) : null;
    const leftArmNum = inputLeftArm.trim() ? parseFloat(inputLeftArm) : null;
    const rightArmNum = inputRightArm.trim() ? parseFloat(inputRightArm) : null;
    const leftThighNum = inputLeftThigh.trim() ? parseFloat(inputLeftThigh) : null;
    const rightThighNum = inputRightThigh.trim() ? parseFloat(inputRightThigh) : null;
    const leftCalfNum = inputLeftCalf.trim() ? parseFloat(inputLeftCalf) : null;
    const rightCalfNum = inputRightCalf.trim() ? parseFloat(inputRightCalf) : null;
    const neckNum = inputNeck.trim() ? parseFloat(inputNeck) : null;

    if (
      weightNum === null &&
      bodyFatNum === null &&
      !inputNotes.trim() &&
      !photoFile &&
      !photoPreview &&
      chestNum === null &&
      waistNum === null &&
      hipsNum === null &&
      leftArmNum === null &&
      rightArmNum === null
    ) {
      setFormError('Please enter at least weight, body fat %, measurements, notes, or a photo.');
      return;
    }

    if (weightNum !== null && (isNaN(weightNum) || weightNum <= 0 || weightNum > 500)) {
      setFormError('Please enter a valid weight in kg.');
      return;
    }

    if (bodyFatNum !== null && (isNaN(bodyFatNum) || bodyFatNum < 0 || bodyFatNum > 100)) {
      setFormError('Body Fat % must be between 0 and 100.');
      return;
    }

    setSubmitting(true);

    let photoUrl = photoPreview || undefined;

    if (photoFile) {
      const uploadRes = await ProgressService.uploadProgressPhoto(photoFile, userId);
      if (uploadRes.success && uploadRes.data) {
        photoUrl = uploadRes.data;
      } else if (uploadRes.error) {
        setFormError(uploadRes.error);
        setSubmitting(false);
        return;
      }
    }

    const recordedAtIso = inputRecordedAt ? new Date(inputRecordedAt).toISOString() : new Date().toISOString();

    if (editingLog) {
      const updateRes = await ProgressService.updateProgressEntry({
        id: editingLog.id,
        weight: weightNum,
        body_fat_percentage: bodyFatNum,
        height: heightNum,
        chest: chestNum,
        waist: waistNum,
        hips: hipsNum,
        left_arm: leftArmNum,
        right_arm: rightArmNum,
        left_thigh: leftThighNum,
        right_thigh: rightThighNum,
        left_calf: leftCalfNum,
        right_calf: rightCalfNum,
        neck: neckNum,
        notes: inputNotes,
        progress_photo_url: photoUrl,
        recorded_at: recordedAtIso,
      }, userId);

      if (updateRes.success) {
        showToast('Progress entry updated successfully');
        setIsModalOpen(false);
        resetForm();
        loadUserData();
        window.dispatchEvent(new Event('reppulse_progress_updated'));
        window.dispatchEvent(new Event('reppulse_weight_updated'));
      } else {
        setFormError(updateRes.error || 'Failed to update entry');
      }
    } else {
      const addRes = await ProgressService.addProgressEntry({
        weight: weightNum,
        body_fat_percentage: bodyFatNum,
        height: heightNum,
        chest: chestNum,
        waist: waistNum,
        hips: hipsNum,
        left_arm: leftArmNum,
        right_arm: rightArmNum,
        left_thigh: leftThighNum,
        right_thigh: rightThighNum,
        left_calf: leftCalfNum,
        right_calf: rightCalfNum,
        neck: neckNum,
        notes: inputNotes,
        progress_photo_url: photoUrl,
        recorded_at: recordedAtIso,
      }, userId);

      if (addRes.success) {
        showToast('Progress entry added successfully');
        setIsModalOpen(false);
        resetForm();
        loadUserData();
        window.dispatchEvent(new Event('reppulse_progress_updated'));
        window.dispatchEvent(new Event('reppulse_weight_updated'));
      } else {
        setFormError(addRes.error || 'Failed to add entry');
      }
    }

    setSubmitting(false);
  };

  const handleDeleteLog = async () => {
    if (!confirmDeleteLog) return;
    const targetId = confirmDeleteLog.id;
    setDeletingId(targetId);

    const delRes = await ProgressService.deleteProgressEntry(targetId, userId);
    setDeletingId(null);
    setConfirmDeleteLog(null);

    if (delRes.success) {
      showToast('Progress entry deleted');
      loadUserData();
      window.dispatchEvent(new Event('reppulse_progress_updated'));
      window.dispatchEvent(new Event('reppulse_weight_updated'));
    } else {
      showToast(delRes.error || 'Failed to delete progress entry', 'error');
    }
  };

  return {
    workouts,
    progressLogs,
    profileWeight,
    loading,
    dbStatus,
    toast,
    isModalOpen,
    setIsModalOpen,
    editingLog,
    confirmDeleteLog,
    setConfirmDeleteLog,
    showMeasurements,
    setShowMeasurements,
    inputWeight,
    setInputWeight,
    inputBodyFat,
    setInputBodyFat,
    inputHeight,
    setInputHeight,
    inputChest,
    setInputChest,
    inputWaist,
    setInputWaist,
    inputHips,
    setInputHips,
    inputLeftArm,
    setInputLeftArm,
    inputRightArm,
    setInputRightArm,
    inputLeftThigh,
    setInputLeftThigh,
    inputRightThigh,
    setInputRightThigh,
    inputLeftCalf,
    setInputLeftCalf,
    inputRightCalf,
    setInputRightCalf,
    inputNeck,
    setInputNeck,
    inputNotes,
    setInputNotes,
    inputRecordedAt,
    setInputRecordedAt,
    photoFile,
    setPhotoFile,
    photoPreview,
    setPhotoPreview,
    submitting,
    deletingId,
    formError,
    userId,
    showToast,
    loadUserData,
    handlePhotoSelect,
    resetForm,
    openAddModal,
    openEditModal,
    handleSaveProgress,
    handleDeleteLog,
  };
}
