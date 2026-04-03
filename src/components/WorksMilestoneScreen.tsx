import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

interface WorksMilestoneScreenProps {
  isOpen: boolean;
  total: number;
  onContinue: () => void;
}

const MILESTONE_TEXT: Record<number, { title: string; subtitle: string }> = {
  50:  { title: '初具规模',  subtitle: '50道记录在册，你的味觉版图开始成形' },
  100: { title: '百味人生',  subtitle: '整整100道，每一道都是认真生活的证明' },
  150: { title: '食光荏苒',  subtitle: '150道，时间因为美食而值得被记住' },
  200: { title: '二百食光',  subtitle: '你的味觉地图已经超过大多数人了' },
};

const getMilestoneText = (total: number) =>
  MILESTONE_TEXT[total] ?? {
    title: `${total}道里程碑`,
    subtitle: '还在继续，这才是真正的食光记录者',
  };

// Generate stable particle data once per render
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  size: 4 + Math.random() * 6,
  delay: Math.random() * 1.2,
  duration: 2.5 + Math.random() * 2,
}));

const WorksMilestoneScreen: React.FC<WorksMilestoneScreenProps> = ({
  isOpen,
  total,
  onContinue,
}) => {
  const { title, subtitle } = getMilestoneText(total);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Floating particles */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: '110vh', x: `${p.x}vw` }}
              animate={{ opacity: [0, 0.7, 0], y: '-10vh', x: `${p.x}vw` }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute rounded-full bg-primary/40"
              style={{ width: p.size, height: p.size, bottom: 0, left: 0 }}
            />
          ))}

          {/* Content */}
          <div className="relative flex flex-col items-center gap-8 px-10 text-center">
            {/* Number */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-[88px] font-black leading-none text-primary">{total}</span>
              <span className="text-lg font-bold text-muted-foreground tracking-widest uppercase -mt-2">道</span>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col gap-2"
            >
              <p className="text-2xl font-black text-foreground tracking-wide">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
            </motion.div>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeInOut' }}
              className="w-16 h-px bg-primary/40 origin-center"
            />

            {/* Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="w-full"
            >
              <Button
                onClick={onContinue}
                className="w-full rounded-2xl h-14 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                继续记录
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorksMilestoneScreen;
