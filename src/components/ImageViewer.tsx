import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialIndex = 0, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center touch-none"
          onClick={onClose}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
            {images.length > 1 && (
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
                {currentIndex + 1} / {images.length}
              </span>
            )}
            <div className="w-10" />
          </div>

          {/* Image Container */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <motion.div
              key={currentIndex}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain shadow-2xl select-none"
                referrerPolicy="no-referrer"
                onContextMenu={(e) => e.preventDefault()} // Optional: prevent context menu if you want to force long press hint, but usually better to let native work
              />
            </motion.div>

            {/* Navigation Arrows (Desktop/Large screens) */}
            {images.length > 1 && (
              <>
                {currentIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 backdrop-blur-sm text-white rounded-full hover:bg-white/10 transition-colors hidden md:block"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                {currentIndex < images.length - 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/5 backdrop-blur-sm text-white rounded-full hover:bg-white/10 transition-colors hidden md:block"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </>
            )}

            {/* Swipe Areas (Mobile) */}
            <div className="absolute inset-y-0 left-0 w-1/4 md:hidden" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-1/4 md:hidden" onClick={handleNext} />
          </div>

          {/* Footer Hint */}
          <div className="absolute bottom-10 left-0 right-0 text-center">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
              长按图片保存到相册
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageViewer;
