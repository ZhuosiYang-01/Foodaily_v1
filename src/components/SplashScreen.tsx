import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  // 自动关闭兜底：如果用户不知道怎么上滑，5秒后自动关闭
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDragEnd = (_: any, info: any) => {
    // If dragged up more than 100px or velocity is high enough
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
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
            
            {/* Floating Emojis */}
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] left-[10%] text-4xl opacity-40 grayscale-[0.5]"
            >
              🥐
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[20%] right-[15%] text-3xl opacity-40 grayscale-[0.5]"
            >
              🥑
            </motion.div>
            <motion.div 
              animate={{ y: [0, -15, 0], rotate: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-[25%] left-[15%] text-4xl opacity-40 grayscale-[0.5]"
            >
              🍳
            </motion.div>
            <motion.div 
              animate={{ y: [0, 25, 0], rotate: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-[20%] right-[10%] text-3xl opacity-40 grayscale-[0.5]"
            >
              ☕
            </motion.div>
            <motion.div 
              animate={{ y: [0, -25, 0], rotate: [0, 20, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute top-[40%] left-[5%] text-2xl opacity-30 grayscale-[0.5]"
            >
              🥯
            </motion.div>
            <motion.div 
              animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="absolute top-[45%] right-[5%] text-2xl opacity-30 grayscale-[0.5]"
            >
              🥗
            </motion.div>
            <motion.div 
              animate={{ y: [0, -10, 0], rotate: [0, 15, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute bottom-[40%] left-[8%] text-2xl opacity-30 grayscale-[0.5]"
            >
              🥘
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -12, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1.7 }}
              className="absolute bottom-[45%] right-[8%] text-2xl opacity-30 grayscale-[0.5]"
            >
              🍰
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col items-center space-y-8 pointer-events-none select-none"
          >
            {/* Title Block */}
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-light tracking-[0.4em] uppercase serif text-foreground pl-[0.4em]">
                Foodaily
              </h1>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
                className="h-[1px] w-48 bg-primary/30 mt-4 origin-center"
              />
            </div>

            {/* Slogan Block */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="flex flex-col items-center"
            >
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground pl-[0.15em] serif">
                Your Daily Cooking Gallery
              </p>
            </motion.div>
          </motion.div>

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
