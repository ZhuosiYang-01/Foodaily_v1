import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

interface MilestoneBadgeModalProps {
  isOpen: boolean;
  count: 5 | 10 | 20;
  workName: string;
  onContinue: () => void;
}

const MILESTONE_TEXT: Record<number, { title: string; subtitle: string }> = {
  5:  { title: '初尝心得', subtitle: '开始有感觉了' },
  10: { title: '驾轻就熟', subtitle: '这道已经刻进味觉记忆' },
  20: { title: '炉火纯青', subtitle: '你已是这道菜的行家' },
};

const MilestoneBadgeModal: React.FC<MilestoneBadgeModalProps> = ({
  isOpen,
  count,
  workName,
  onContinue,
}) => {
  const text = MILESTONE_TEXT[count];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-8"
          onClick={onContinue}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="bg-background rounded-[2.5rem] p-8 w-full max-w-[300px] flex flex-col items-center gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulse ring */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-28 h-28 rounded-full bg-primary/20"
              />
              {/* Badge circle */}
              <motion.div
                initial={{ rotate: -15, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex flex-col items-center justify-center shadow-lg shadow-primary/30"
              >
                <span className="text-3xl font-black text-primary-foreground leading-none">{count}</span>
                <span className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-widest mt-0.5">次</span>
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <p className="text-xl font-black text-foreground tracking-wide">{text.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">{workName}</span>
                {' · 第'}{count}{'次，'}{text.subtitle}
              </p>
            </motion.div>

            {/* Divider */}
            <div className="w-12 h-px bg-border" />

            {/* Button */}
            <Button
              onClick={onContinue}
              className="w-full rounded-2xl h-11 text-xs font-bold uppercase tracking-widest"
            >
              继续
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MilestoneBadgeModal;
