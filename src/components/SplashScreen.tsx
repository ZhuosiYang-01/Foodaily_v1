import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  // 自动关闭兜底：5秒后自动关闭，给用户足够时间阅读 slogan
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDragEnd = (_: any, info: any) => {
    // 向上滑动超过 100px 或速度足够快时关闭
    if (info.offset.y < -100 || info.velocity.y < -500) {
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {isVisible && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.6, ease: [0.45, 0, 0.55, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.8, bottom: 0.1 }}
          onDragEnd={handleDragEnd}
          className="fixed inset-0 max-w-md mx-auto z-[100] bg-background flex flex-col items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center space-y-8 pointer-events-none select-none"
          >
            {/* Title Block */}
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-light tracking-[0.3em] uppercase serif text-foreground pl-[0.3em]">
                Foodaily
              </h1>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
                className="h-[1px] w-32 bg-primary/40 mt-6 origin-center"
              />
            </div>

            {/* Slogan Block */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col items-center"
            >
              <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground pl-[0.2em] serif">
                Your Daily Cooking Gallery
              </p>
            </motion.div>
          </motion.div>

          {/* Swipe Up Indicator */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="absolute bottom-12 flex flex-col items-center space-y-2 pointer-events-none select-none"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronUp size={24} className="text-primary/60" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
