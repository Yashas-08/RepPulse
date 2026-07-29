import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { SavedWorkoutRecord } from '../services/workoutSaveService';
import { WorkoutHistoryService } from '../services/workoutHistoryService';
import { DataManagementService } from '../services/dataManagementService';

export interface UseWorkoutHistoryScreenProps {
  currentUser: User | null;
}

export function useWorkoutHistoryScreen({ currentUser }: UseWorkoutHistoryScreenProps) {
  const [historyRecords, setHistoryRecords] = useState<SavedWorkoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SavedWorkoutRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteHistoryConfirm, setShowDeleteHistoryConfirm] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  const userId = currentUser?.id || 'guest';

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load history records
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await WorkoutHistoryService.getWorkoutHistory(userId);
      if (res.success && res.data) {
        setHistoryRecords(res.data);
      } else if (res.error) {
        setErrorMsg(res.error || 'Failed to load workout history.');
      }
    } catch (err: unknown) {
      setErrorMsg('Network or database connection issue. Please check connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();

    const handleUpdate = () => {
      loadHistory();
    };

    window.addEventListener('reppulse_workouts_updated', handleUpdate);
    return () => {
      window.removeEventListener('reppulse_workouts_updated', handleUpdate);
    };
  }, [loadHistory]);

  // Handle selecting a record for detail view
  const handleSelectRecord = async (record: SavedWorkoutRecord) => {
    setIsDetailsLoading(true);
    setSelectedRecord(record);

    try {
      const res = await WorkoutHistoryService.getWorkoutDetails(record.id);
      if (res.success && res.data) {
        setSelectedRecord(res.data);
      }
    } catch (err: unknown) {
      console.warn('Failed to load full workout details:', err);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setIsDeletingHistory(true);
    try {
      const res = await DataManagementService.deleteWorkoutHistory(userId);
      if (res.success) {
        showToast('Workout history cleared successfully.');
        setShowDeleteHistoryConfirm(false);
        setSelectedRecord(null);
        await loadHistory();
        window.dispatchEvent(new Event('reppulse_workouts_updated'));
      } else {
        showToast(res.error || 'Failed to clear history.', 'error');
      }
    } catch (err: unknown) {
      showToast('Error clearing history.', 'error');
    } finally {
      setIsDeletingHistory(false);
    }
  };

  return {
    historyRecords,
    isLoading,
    isDetailsLoading,
    errorMsg,
    selectedRecord,
    setSelectedRecord,
    toast,
    showDeleteHistoryConfirm,
    setShowDeleteHistoryConfirm,
    isDeletingHistory,
    userId,
    showToast,
    loadHistory,
    handleSelectRecord,
    handleClearHistory,
  };
}
