import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Loader2, 
  Plus, 
  X, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Scale,
  Edit2,
  Trash2,
  Camera,
  ChevronDown,
  ChevronUp,
  Ruler,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Workout } from '../types';
import { ProgressLog } from '../types/progress';
import { ProgressService } from '../services/progressService';
import { useProgressScreen } from '../hooks/useProgressScreen';
import { User } from '@supabase/supabase-js';
import { Button, Input } from '../components/UI';

interface ProgressScreenProps {
  currentUser: User | null;
  onNavigate?: (screen: any) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ currentUser, onNavigate }) => {
  const {
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
    openAddModal: handleOpenModalAdd,
    openEditModal: handleOpenModalEdit,
    handleSaveProgress,
    handleDeleteLog,
  } = useProgressScreen({ currentUser });

  const handleOpenModal = (logToEdit?: ProgressLog) => {
    if (logToEdit) {
      handleOpenModalEdit(logToEdit);
    } else {
      handleOpenModalAdd();
    }
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  // Workout metrics calculation
  const totalCompleted = workouts.length;

  // Streak calculation
  const calculateStreak = (completedList: Workout[]): number => {
    if (completedList.length === 0) return 0;

    const uniqueDates = Array.from(new Set(
      completedList.map(w => {
        const d = new Date(w.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )).sort((a, b) => b.localeCompare(a));

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

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const d1 = new Date(uniqueDates[i - 1]);
      const d2 = new Date(uniqueDates[i]);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = useMemo(() => calculateStreak(workouts), [workouts]);

  // Latest weight from progress logs or profile
  const latestWeight = useMemo(() => {
    const logWithWeight = progressLogs.find((p) => p.weight !== null && p.weight !== undefined);
    if (logWithWeight && logWithWeight.weight) return logWithWeight.weight;
    return profileWeight ? parseFloat(profileWeight) : null;
  }, [progressLogs, profileWeight]);

  // Workout chart data
  const workoutChartData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    workouts.forEach(w => {
      const d = new Date(w.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      groups[key] = (groups[key] || 0) + w.sets;
    });

    return Object.entries(groups)
      .map(([dateStr, value]) => {
        const d = new Date(dateStr);
        const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { dateStr, displayDate, value };
      })
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [workouts]);

  // Delete Handler
  const handleDeleteConfirm = handleDeleteLog;

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden select-none" id="progress-screen">
      
      {/* TOP APP BAR */}
      <header className="h-14 bg-white border-b border-border-cool flex items-center justify-between px-5 sticky top-0 z-40 shrink-0" id="progress-header">
        <div>
          <h1 className="font-display font-bold text-base text-neutral-900 tracking-tight uppercase" id="progress-title">
            Progress
          </h1>
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest -mt-0.5" id="progress-subtitle">
            Track your consistency & metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-bg-snow px-2.5 py-1 rounded-full border border-border-cool">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">
              {dbStatus === 'connected' ? 'Synced' : 'Local'}
            </span>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Add Progress Entry"
            id="add-progress-header-btn"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* SCROLLABLE VIEWPORT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 flex flex-col gap-6 pb-24" id="progress-content">
        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse">
            {/* Skeletal consistency summary */}
            <div className="flex flex-col gap-2.5">
              <div className="h-3 w-1/3 bg-neutral-100 rounded" />
              <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-neutral-50/40 rounded-2xl border border-neutral-100" />
                ))}
              </div>
            </div>
            {/* Skeletal charts */}
            <div className="flex flex-col gap-2.5">
              <div className="h-3 w-1/4 bg-neutral-100 rounded" />
              <div className="h-40 bg-neutral-50/40 rounded-2xl border border-neutral-100" />
            </div>
            {/* Skeletal timeline logs */}
            <div className="flex flex-col gap-2.5">
              <div className="h-3 w-1/4 bg-neutral-100 rounded" />
              <div className="h-32 bg-neutral-50/40 rounded-2xl border border-neutral-100" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* PROGRESS SUMMARY */}
            <div className="flex flex-col gap-2.5" id="progress-summary-section">
              <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase pl-0.5">
                Consistency Summary
              </span>
              
              <div className="grid grid-cols-3 gap-2.5">
                {/* Total Workouts */}
                <div className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
                  <span className="font-sans font-bold text-xl text-neutral-900 tracking-tight">
                    {totalCompleted > 0 ? totalCompleted : '0'}
                  </span>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5 leading-tight">
                    Completed Workouts
                  </span>
                </div>

                {/* Workout Streak */}
                <div className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
                  <span className="font-sans font-bold text-xl text-neutral-900 tracking-tight flex items-center gap-0.5">
                    {currentStreak > 0 ? `${currentStreak}d` : '0d'}
                  </span>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5 leading-tight">
                    Workout Streak
                  </span>
                </div>

                {/* Current Weight */}
                <div className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col items-center text-center shadow-xs">
                  <span className="font-sans font-bold text-xl text-neutral-900 tracking-tight">
                    {latestWeight !== null ? `${latestWeight} kg` : '—'}
                  </span>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider mt-1.5 leading-tight">
                    Current Weight
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIVITY CALENDAR CARD */}
            <div 
              onClick={() => onNavigate && onNavigate('calendar')}
              className="bg-neutral-900 text-white rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-800 transition-all shadow-xs active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-white leading-tight">
                    Activity Calendar
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    View monthly workouts, meals & weight logs
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700 shrink-0">
                Open
              </span>
            </div>

            {/* WORKOUT ACTIVITY CHART */}
            <div className="flex flex-col gap-2.5" id="workout-activity-section">
              <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase pl-0.5">
                Workout Activity
              </span>

              {workoutChartData.length === 0 ? (
                /* EMPTY WORKOUT STATE */
                <div className="bg-white border border-border-cool rounded-2xl p-8 flex flex-col items-center text-center shadow-xs" id="workout-empty">
                  <div className="w-12 h-12 rounded-full bg-neutral-50 border border-border-cool flex items-center justify-center text-neutral-400 mb-4">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-neutral-900 uppercase tracking-wide">
                    No workout activity yet.
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1 max-w-[240px] leading-relaxed font-normal">
                    Complete workouts to start seeing your consistency trend.
                  </p>
                  <Button
                    onClick={() => onNavigate && onNavigate('workout')}
                    variant="primary"
                    className="mt-5 w-full max-w-[200px]"
                  >
                    Start a Workout
                  </Button>
                </div>
              ) : (
                /* REAL WORKOUT LINE CHART */
                <div className="bg-white border border-border-cool rounded-2xl p-5 flex flex-col gap-4 shadow-xs" id="workout-chart">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-sans font-semibold text-sm text-neutral-900 uppercase tracking-tight">
                        Consistency Wave
                      </h4>
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                        Total sets completed per workout day
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-900 bg-bg-snow border border-border-cool px-2.5 py-1 rounded-full">
                      {workouts.length} entries
                    </span>
                  </div>

                  {/* SVG line chart */}
                  <div className="h-32 w-full flex flex-col justify-end pt-4" id="workout-svg-container">
                    <div className="flex-1 w-full relative">
                      <svg viewBox="0 0 100 30" className="w-full h-full text-neutral-900 overflow-visible" preserveAspectRatio="none">
                        {(() => {
                          const maxVal = Math.max(...workoutChartData.map(p => p.value), 1);
                          const points = workoutChartData.map((p, idx) => {
                            const x = workoutChartData.length > 1 ? (idx / (workoutChartData.length - 1)) * 100 : 50;
                            const y = 28 - ((p.value / maxVal) * 24);
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <>
                              {/* Grid lines */}
                              <line x1="0" y1="28" x2="100" y2="28" stroke="#f0f0f0" strokeWidth="0.5" />
                              <line x1="0" y1="16" x2="100" y2="16" stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="1 2" />
                              <line x1="0" y1="4" x2="100" y2="4" stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="1 2" />

                              {/* Connected line */}
                              <polyline
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points}
                              />

                              {/* Highlight dots */}
                              {workoutChartData.map((p, idx) => {
                                const x = workoutChartData.length > 1 ? (idx / (workoutChartData.length - 1)) * 100 : 50;
                                const y = 28 - ((p.value / maxVal) * 24);
                                return (
                                  <circle 
                                    key={idx}
                                    cx={x} 
                                    cy={y} 
                                    r="1.8" 
                                    className="fill-neutral-900 stroke-white stroke-[0.8px]" 
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* X Axis dates */}
                    <div className="flex justify-between text-[8px] text-neutral-400 font-bold uppercase tracking-wider font-mono mt-3 border-t border-border-cool pt-2 px-1">
                      <span>{workoutChartData[0]?.displayDate}</span>
                      <span>{workoutChartData[workoutChartData.length - 1]?.displayDate}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PROGRESS TIMELINE SECTION */}
            <div className="flex flex-col gap-2.5" id="progress-timeline-section">
              <div className="flex justify-between items-center pl-0.5 pr-0.5">
                <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                  Progress Timeline
                </span>
                <button
                  onClick={() => handleOpenModal()}
                  className="text-xs font-bold text-neutral-900 flex items-center gap-1 hover:underline cursor-pointer"
                  id="add-entry-btn"
                >
                  <Plus size={14} />
                  <span>Add Entry</span>
                </button>
              </div>

              {progressLogs.length === 0 ? (
                /* EMPTY PROGRESS TIMELINE STATE */
                <div className="bg-white border border-border-cool rounded-2xl p-8 flex flex-col items-center text-center shadow-xs" id="progress-empty">
                  <div className="w-12 h-12 rounded-full bg-neutral-50 border border-border-cool flex items-center justify-center text-neutral-400 mb-4">
                    <Scale size={20} />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-neutral-900 uppercase tracking-wide">
                    No progress logs yet.
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1 max-w-[240px] leading-relaxed font-normal">
                    Log weight, body fat %, measurements, or progress photos to track changes over time.
                  </p>
                  <Button
                    onClick={() => handleOpenModal()}
                    variant="primary"
                    className="mt-5 w-full max-w-[200px]"
                  >
                    Add Progress Entry
                  </Button>
                </div>
              ) : (
                /* TIMELINE CARDS */
                <div className="flex flex-col gap-3" id="progress-timeline-list">
                  
                  {/* Optional Sparkline chart if >= 2 entries with weight */}
                  {(() => {
                    const logsWithWeight = progressLogs.filter((p) => p.weight !== null && p.weight !== undefined);
                    if (logsWithWeight.length < 2) return null;
                    const chronWeights = [...logsWithWeight].reverse();
                    return (
                      <div className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col gap-2 shadow-xs mb-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Weight Trend</span>
                          <span className="text-[10px] font-bold text-neutral-900 bg-bg-snow border border-border-cool px-2 py-0.5 rounded-full font-mono">
                            {(chronWeights[chronWeights.length - 1].weight! - chronWeights[0].weight!) >= 0 ? '+' : ''}
                            {(chronWeights[chronWeights.length - 1].weight! - chronWeights[0].weight!).toFixed(1)} kg
                          </span>
                        </div>
                        <div className="h-14 w-full flex items-end pt-2">
                          <svg viewBox="0 0 100 20" className="w-full h-full text-neutral-900 overflow-visible" preserveAspectRatio="none">
                            {(() => {
                              const weights = chronWeights.map(r => r.weight!);
                              const maxW = Math.max(...weights);
                              const minW = Math.min(...weights);
                              const range = (maxW - minW) || 1;

                              const points = chronWeights.map((r, idx) => {
                                const x = (idx / (chronWeights.length - 1)) * 100;
                                const y = 18 - (((r.weight! - minW) / range) * 16);
                                return `${x},${y}`;
                              }).join(' ');

                              return (
                                <polyline
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={points}
                                />
                              );
                            })()}
                          </svg>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Entry Cards */}
                  {progressLogs.map((log) => {
                    const formattedDate = new Date(log.recorded_at || log.created_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    const hasMeasurements =
                      log.chest || log.waist || log.hips ||
                      log.left_arm || log.right_arm ||
                      log.left_thigh || log.right_thigh ||
                      log.left_calf || log.right_calf || log.neck;

                    return (
                      <div
                        key={log.id}
                        className="bg-white border border-border-cool rounded-2xl p-4 flex flex-col gap-3 shadow-xs hover:border-neutral-300 transition-all relative group"
                      >
                        {/* Header: Date + Actions */}
                        <div className="flex justify-between items-center border-b border-border-cool/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-neutral-400" />
                            <span className="text-xs font-semibold text-neutral-900">
                              {formattedDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenModal(log)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteLog(log)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Content Grid */}
                        <div className="flex flex-col gap-2.5">
                          
                          {/* Main Badges: Weight & Body Fat & Height */}
                          <div className="flex flex-wrap gap-2 items-center">
                            {log.weight !== null && log.weight !== undefined && (
                              <div className="bg-neutral-900 text-white px-3 py-1 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5">
                                <Scale size={12} />
                                <span>{log.weight} kg</span>
                              </div>
                            )}

                            {log.body_fat_percentage !== null && log.body_fat_percentage !== undefined && (
                              <div className="bg-bg-snow border border-border-cool text-neutral-800 px-2.5 py-1 rounded-xl text-xs font-semibold font-mono">
                                Body Fat: {log.body_fat_percentage}%
                              </div>
                            )}

                            {log.height !== null && log.height !== undefined && (
                              <div className="bg-bg-snow border border-border-cool text-neutral-800 px-2.5 py-1 rounded-xl text-xs font-semibold font-mono">
                                Height: {log.height} cm
                              </div>
                            )}
                          </div>

                          {/* Measurements Grid */}
                          {hasMeasurements && (
                            <div className="bg-neutral-50/80 rounded-xl p-2.5 border border-border-cool flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                <Ruler size={10} />
                                <span>Body Measurements</span>
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-[11px] font-mono text-neutral-700">
                                {log.chest && <div>Chest: <strong className="text-neutral-900">{log.chest} cm</strong></div>}
                                {log.waist && <div>Waist: <strong className="text-neutral-900">{log.waist} cm</strong></div>}
                                {log.hips && <div>Hips: <strong className="text-neutral-900">{log.hips} cm</strong></div>}
                                {log.left_arm && <div>L. Arm: <strong className="text-neutral-900">{log.left_arm} cm</strong></div>}
                                {log.right_arm && <div>R. Arm: <strong className="text-neutral-900">{log.right_arm} cm</strong></div>}
                                {log.left_thigh && <div>L. Thigh: <strong className="text-neutral-900">{log.left_thigh} cm</strong></div>}
                                {log.right_thigh && <div>R. Thigh: <strong className="text-neutral-900">{log.right_thigh} cm</strong></div>}
                                {log.left_calf && <div>L. Calf: <strong className="text-neutral-900">{log.left_calf} cm</strong></div>}
                                {log.right_calf && <div>R. Calf: <strong className="text-neutral-900">{log.right_calf} cm</strong></div>}
                                {log.neck && <div>Neck: <strong className="text-neutral-900">{log.neck} cm</strong></div>}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {log.notes && (
                            <div className="text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-border-cool flex items-start gap-2">
                              <FileText size={13} className="text-neutral-400 shrink-0 mt-0.5" />
                              <span className="whitespace-pre-wrap italic">{log.notes}</span>
                            </div>
                          )}

                          {/* Photo Preview */}
                          {log.progress_photo_url && (
                            <div className="mt-1 relative rounded-xl overflow-hidden border border-border-cool max-h-48 bg-neutral-900 flex items-center justify-center">
                              <img
                                src={log.progress_photo_url}
                                alt="Progress Photo"
                                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ADD / EDIT PROGRESS ENTRY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40" id="progress-modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full bg-white rounded-t-[24px] border-t border-border-cool p-6 flex flex-col gap-5 z-10 shadow-xl max-h-[92%] overflow-y-auto no-scrollbar pb-10"
              id="progress-modal-sheet"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-semibold text-base text-neutral-900 uppercase tracking-tight">
                    {editingLog ? 'Edit Progress Entry' : 'Add Progress Entry'}
                  </h3>
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mt-0.5">
                    Log weight, measurements & photos
                  </p>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full bg-neutral-50 border border-border-cool flex items-center justify-center text-neutral-500 hover:text-neutral-950 active:scale-90 transition-all cursor-pointer"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border border-red-100">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProgress} className="flex flex-col gap-4">
                
                {/* Date Selection */}
                <Input
                  label="Date Recorded *"
                  type="date"
                  required
                  disabled={submitting}
                  value={inputRecordedAt}
                  onChange={(e) => setInputRecordedAt(e.target.value)}
                />

                {/* Primary Metrics: Weight & Body Fat % */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Weight (kg)"
                    type="number"
                    step="0.1"
                    disabled={submitting}
                    placeholder="e.g. 75.5"
                    value={inputWeight}
                    onChange={(e) => setInputWeight(e.target.value)}
                  />
                  <Input
                    label="Body Fat (%)"
                    type="number"
                    step="0.1"
                    disabled={submitting}
                    placeholder="e.g. 15.0"
                    value={inputBodyFat}
                    onChange={(e) => setInputBodyFat(e.target.value)}
                  />
                </div>

                {/* Height */}
                <Input
                  label="Height (cm)"
                  type="number"
                  step="0.5"
                  disabled={submitting}
                  placeholder="e.g. 178"
                  value={inputHeight}
                  onChange={(e) => setInputHeight(e.target.value)}
                />

                {/* Collapsible Body Measurements */}
                <div className="border border-border-cool rounded-2xl p-3.5 flex flex-col gap-3 bg-neutral-50/50">
                  <button
                    type="button"
                    onClick={() => setShowMeasurements(!showMeasurements)}
                    className="flex justify-between items-center text-xs font-semibold text-neutral-900 uppercase tracking-wide cursor-pointer w-full"
                  >
                    <span className="flex items-center gap-1.5">
                      <Ruler size={14} className="text-neutral-500" />
                      <span>Body Measurements (cm)</span>
                    </span>
                    {showMeasurements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showMeasurements && (
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border-cool/60">
                      <Input label="Chest" type="number" step="0.1" placeholder="cm" value={inputChest} onChange={(e) => setInputChest(e.target.value)} disabled={submitting} />
                      <Input label="Waist" type="number" step="0.1" placeholder="cm" value={inputWaist} onChange={(e) => setInputWaist(e.target.value)} disabled={submitting} />
                      <Input label="Hips" type="number" step="0.1" placeholder="cm" value={inputHips} onChange={(e) => setInputHips(e.target.value)} disabled={submitting} />
                      <Input label="Neck" type="number" step="0.1" placeholder="cm" value={inputNeck} onChange={(e) => setInputNeck(e.target.value)} disabled={submitting} />
                      <Input label="Left Arm" type="number" step="0.1" placeholder="cm" value={inputLeftArm} onChange={(e) => setInputLeftArm(e.target.value)} disabled={submitting} />
                      <Input label="Right Arm" type="number" step="0.1" placeholder="cm" value={inputRightArm} onChange={(e) => setInputRightArm(e.target.value)} disabled={submitting} />
                      <Input label="Left Thigh" type="number" step="0.1" placeholder="cm" value={inputLeftThigh} onChange={(e) => setInputLeftThigh(e.target.value)} disabled={submitting} />
                      <Input label="Right Thigh" type="number" step="0.1" placeholder="cm" value={inputRightThigh} onChange={(e) => setInputRightThigh(e.target.value)} disabled={submitting} />
                      <Input label="Left Calf" type="number" step="0.1" placeholder="cm" value={inputLeftCalf} onChange={(e) => setInputLeftCalf(e.target.value)} disabled={submitting} />
                      <Input label="Right Calf" type="number" step="0.1" placeholder="cm" value={inputRightCalf} onChange={(e) => setInputRightCalf(e.target.value)} disabled={submitting} />
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    disabled={submitting}
                    placeholder="How are you feeling? Add any observations..."
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    className="w-full bg-white border border-border-cool rounded-2xl p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-all font-sans"
                  />
                </div>

                {/* Progress Photo Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                    Progress Photo
                  </label>
                  
                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border-cool bg-neutral-900 h-36 flex items-center justify-center">
                      <img src={photoPreview} alt="Preview" className="w-full h-36 object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoFile(null);
                        }}
                        className="absolute top-2 right-2 bg-neutral-900/80 text-white rounded-full p-1 hover:bg-neutral-900 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-border-cool rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-all cursor-pointer bg-neutral-50/50">
                      <Camera size={20} />
                      <span className="text-xs font-semibold">Upload Photo</span>
                      <span className="text-[9px] font-mono text-neutral-400">PNG or JPG up to 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoSelect}
                        disabled={submitting}
                      />
                    </label>
                  )}
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex flex-col gap-2 mt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="primary"
                    className="w-full flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingLog ? 'Update Entry' : 'Save Progress Entry'}</span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    disabled={submitting}
                    onClick={handleCloseModal}
                    variant="secondary"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG */}
      <AnimatePresence>
        {confirmDeleteLog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-5" id="delete-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-border-cool rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-sm text-neutral-900 uppercase">
                    Delete Progress Entry?
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <Button
                  variant="secondary"
                  disabled={deletingId !== null}
                  onClick={() => setConfirmDeleteLog(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  disabled={deletingId !== null}
                  onClick={handleDeleteConfirm}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  {deletingId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span>Delete</span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="absolute bottom-5 left-4 right-4 z-50 pointer-events-none"
            id="toast"
          >
            <div className="mx-auto max-w-sm bg-neutral-900 text-white rounded-xl p-3.5 border border-neutral-800 shadow-lg flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle size={14} className="text-white shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-white shrink-0" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wide">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
