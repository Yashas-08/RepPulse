import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Dumbbell } from 'lucide-react';
import { Exercise } from '../constants/exerciseLibrary';

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  regionName: string;
  onClose: () => void;
  onAddExercise: (exercise: Exercise) => void;
}

export const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  isOpen,
  regionName,
  onClose,
  onAddExercise,
}) => {
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter an exercise name.');
      return;
    }

    const newExercise: Exercise = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      equipment: equipment.trim() || 'Custom Equipment',
    };

    onAddExercise(newExercise);
    setName('');
    setEquipment('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-border-cool p-6 w-full max-w-sm shadow-xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-cool">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold shadow-2xs">
                <Dumbbell size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-neutral-900 uppercase tracking-tight">
                  Add Custom Exercise
                </h3>
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                  Target: {regionName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Exercise Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Deficit Pushups"
                className="w-full bg-neutral-50 border border-border-cool rounded-xl px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                autoFocus
              />
              {error && <p className="text-[11px] font-medium text-red-600 mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Equipment (Optional)
              </label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g. Weight Plates, Parallettes"
                className="w-full bg-neutral-50 border border-border-cool rounded-xl px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border-cool text-xs font-bold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Exercise</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
