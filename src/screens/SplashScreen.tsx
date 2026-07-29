import React from 'react';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';

export const SplashScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black select-none p-8 h-full w-full">
      <div className="flex flex-col items-center justify-center flex-1 max-w-xs w-full">
        {/* Animated Full Brand Logo (White variant for Dark Background) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.0,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="flex items-center justify-center"
        >
          <Logo size={200} variant="dark" showText={true} />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.85, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          className="text-center -mt-2"
        >
          <p className="text-white font-sans text-[11px] font-bold tracking-[0.3em] uppercase">
            Every Rep Counts.
          </p>
        </motion.div>

        {/* Elegant Subtle Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="w-12 h-[2px] bg-neutral-900 rounded-full overflow-hidden mt-8"
        >
          <motion.div
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut"
            }}
            className="h-full bg-white w-1/2 relative rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
};
