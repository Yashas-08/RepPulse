import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  CheckCircle, 
  Loader2, 
  Settings, 
  ShieldCheck, 
  Database,
  Bell,
  ChevronLeft,
  X,
  Trash2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { DataManagementService } from '../services/dataManagementService';

interface UserSettings {
  units: 'Imperial' | 'Metric';
  calorieTarget: number;
  cloudSync: boolean;
  reminders: boolean;
}

interface SettingsScreenProps {
  currentUser: User | null;
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    units: 'Metric',
    calorieTarget: 2400,
    cloudSync: true,
    reminders: true
  });

  const [isEditingCal, setIsEditingCal] = useState(false);
  const [calInput, setCalInput] = useState('2400');

  // Data Management Reset states
  const [resetType, setResetType] = useState<'workout' | 'nutrition' | 'progress' | 'all' | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const userId = currentUser?.id || 'guest';

  const handlePerformReset = async () => {
    if (!resetType) return;
    setIsResetting(true);
    try {
      let res;
      if (resetType === 'workout') {
        res = await DataManagementService.resetWorkoutData(userId);
      } else if (resetType === 'nutrition') {
        res = await DataManagementService.resetNutritionData(userId);
      } else if (resetType === 'progress') {
        res = await DataManagementService.resetProgressData(userId);
      } else {
        res = await DataManagementService.resetAllUserData(userId);
      }

      if (res.success) {
        showToast(res.message || 'Data reset successfully.', 'success');
      } else {
        showToast(res.error || 'Failed to reset data.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error occurred while resetting.', 'error');
    } finally {
      setIsResetting(false);
      setResetType(null);
    }
  };

  useEffect(() => {
    const fetchSettings = () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem(`reppulse_settings_${currentUser?.id || 'guest'}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
          setCalInput(parsed.calorieTarget.toString());
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
      setLoading(false);
    };

    fetchSettings();
  }, [currentUser]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      localStorage.setItem(`reppulse_settings_${currentUser?.id || 'guest'}`, JSON.stringify(updated));
    } catch (err) {
      console.error('Error writing settings:', err);
    }
    showToast('Preference updated successfully');
  };

  const handleSaveCalories = (e: React.FormEvent) => {
    e.preventDefault();
    const kcal = parseInt(calInput);
    if (isNaN(kcal) || kcal <= 0) {
      showToast('Enter valid calories target', 'error');
      return;
    }

    updateSetting('calorieTarget', kcal);
    setIsEditingCal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none">
      
      {/* TOP APP BAR */}
      <header className="h-14 bg-white border-b border-neutral-100 flex items-center justify-between px-5 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer mr-1"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="font-display font-black text-base text-neutral-900 tracking-tight uppercase">
              Settings
            </h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest -mt-0.5">
              App Configurations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-150">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">
            Control Center
          </span>
        </div>
      </header>

      {/* SCROLLABLE VIEWPORT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 flex flex-col gap-6 pb-24">
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <Loader2 size={24} className="text-neutral-400 animate-spin" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-2">
              Loading preferences...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            
            {/* INTERACTIVE CONTROLS CONTAINER */}
            <div className="flex flex-col border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100 bg-white shadow-xs">
              
              {/* Measurement Unit Info */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Measurement Units</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    Currently: Metric Scale (kg, cm, km)
                  </p>
                </div>
                <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full">
                  Standard V1
                </span>
              </div>

              {/* Calorie Target config */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Daily Calorie Target</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    Goal: {settings.calorieTarget} kcal budget
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingCal(true)}
                  className="bg-neutral-900 text-white font-bold text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-full active:scale-95 transition-all cursor-pointer"
                >
                  Configure
                </button>
              </div>

              {/* Cloud Synchronization switch */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Cloud Synchronization</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    {settings.cloudSync ? 'Auto-backup enabled to Supabase' : 'Offline local storage only'}
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('cloudSync', !settings.cloudSync)}
                  className={`w-9 h-5 rounded-full relative flex items-center px-0.5 shrink-0 cursor-pointer transition-all ${
                    settings.cloudSync ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`}
                >
                  <motion.span 
                    layout
                    className={`w-4 h-4 rounded-full bg-white shadow-xs ${
                      settings.cloudSync ? 'ml-auto' : ''
                    }`} 
                  />
                </button>
              </div>

              {/* Daily Reminder switch */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">Daily Reminders</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    {settings.reminders ? 'Push alerts scheduled daily' : 'Alerts are deactivated'}
                  </p>
                </div>
                <button
                  onClick={() => updateSetting('reminders', !settings.reminders)}
                  className={`w-9 h-5 rounded-full relative flex items-center px-0.5 shrink-0 cursor-pointer transition-all ${
                    settings.reminders ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`}
                >
                  <motion.span 
                    layout
                    className={`w-4 h-4 rounded-full bg-white shadow-xs ${
                      settings.reminders ? 'ml-auto' : ''
                    }`} 
                  />
                </button>
              </div>

            </div>

            {/* DATA MANAGEMENT CARD */}
            <div className="flex flex-col border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-100 bg-white shadow-xs">
              <div className="p-4 bg-neutral-50/70 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-neutral-700" />
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Data Management
                  </span>
                </div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  Reset & Clear
                </span>
              </div>

              {/* Reset Workout Data */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Reset Workout Data
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    Delete session history & stats
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetType('workout')}
                  className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Reset Nutrition Data */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Reset Nutrition Data
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    Clear meal logs & calories
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetType('nutrition')}
                  className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Reset Progress Data */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    Reset Progress Data
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    Clear weight & progress history
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetType('progress')}
                  className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Reset All App Data */}
              <div className="flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                    Reset All App Data
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mt-0.5 tracking-wider">
                    Wipe all workouts, meals & progress
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetType('all')}
                  className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                >
                  Reset All
                </button>
              </div>
            </div>

            {/* VERSION CARD */}
            <div className="p-4 border border-neutral-150 rounded-2xl bg-neutral-50 text-center flex flex-col items-center justify-center">
              <ShieldCheck size={18} className="text-neutral-400 mb-1.5" />
              <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                RepPulse Companion v1.0.0 &bull; Secure Environment
              </p>
            </div>

          </div>
        )}

      </div>

      {/* CONFIGURE CALORIE SHEET */}
      <AnimatePresence>
        {isEditingCal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingCal(false)}
              className="absolute inset-0 bg-neutral-950/20 backdrop-blur-xs z-45"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 rounded-t-3xl shadow-xl z-50 px-6 pt-5 pb-8 flex flex-col"
            >
              <div className="w-12 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                <div>
                  <h4 className="font-display font-black text-sm text-neutral-900 uppercase tracking-wide">
                    Configure Target
                  </h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                    Adjust your daily calorie consumption goal
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingCal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-neutral-900 cursor-pointer border border-neutral-100"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveCalories} className="flex flex-col gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider pl-0.5">
                    Daily Calorie Target (kcal) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 2400"
                    value={calInput}
                    onChange={(e) => setCalInput(e.target.value)}
                    className="h-11 border border-neutral-200 rounded-xl px-3.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCal(false)}
                    className="h-11 rounded-full border border-neutral-200 text-neutral-900 text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-11 rounded-full bg-neutral-950 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                  >
                    Save Target
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RESET CONFIRMATION DIALOG */}
      <AnimatePresence>
        {resetType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl border border-border-cool p-6 w-full max-w-xs shadow-2xl relative overflow-hidden flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>

                {!isResetting && (
                  <button
                    onClick={() => setResetType(null)}
                    className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-neutral-900 tracking-tight">
                  {resetType === 'workout' && 'Reset Workout Data?'}
                  {resetType === 'nutrition' && 'Reset Nutrition Data?'}
                  {resetType === 'progress' && 'Reset Progress Data?'}
                  {resetType === 'all' && 'Reset All App Data?'}
                </h3>
                <p className="text-xs font-normal text-neutral-500 leading-relaxed mt-1">
                  {resetType === 'workout' && 'This will permanently delete all saved workout sessions and history.'}
                  {resetType === 'nutrition' && 'This will permanently delete all logged meals and calorie entries.'}
                  {resetType === 'progress' && 'This will permanently delete all weight tracking and body metrics.'}
                  {resetType === 'all' && 'This will permanently wipe ALL workout, nutrition, and progress data.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setResetType(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border-cool bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handlePerformReset}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Confirm Reset</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SUCCESS NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-5 left-4 right-4 bg-neutral-900 text-white py-3 px-4 rounded-xl shadow-lg border border-neutral-800 z-50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <CheckCircle size={14} className="text-neutral-200 shrink-0" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
