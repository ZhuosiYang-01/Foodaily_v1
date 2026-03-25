import React, { useState, useRef } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCcw } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageReady = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.setAspectRatio(1);
    }
  };

  const handleConfirm = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    
    setIsProcessing(true);
    try {
      // Get cropped canvas and convert to base64
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 1080,
        maxHeight: 1080,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      
      if (canvas) {
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.95);
        onCropComplete(croppedBase64);
        onClose();
      }
    } catch (e) {
      console.error('Failed to crop image', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.rotate(-90);
    }
  };

  const handleReset = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.reset();
      cropper.setAspectRatio(1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col max-w-md mx-auto"
        >
          <style>{`
            .cropper-view-box {
              outline: 1px solid rgba(255, 255, 255, 0.8) !important;
            }
            .cropper-point {
              background-color: transparent !important;
              opacity: 1 !important;
            }
            /* Corners */
            .cropper-point.point-nw,
            .cropper-point.point-ne,
            .cropper-point.point-sw,
            .cropper-point.point-se {
              width: 20px !important;
              height: 20px !important;
            }
            .cropper-point.point-nw {
              border-top: 3px solid white !important;
              border-left: 3px solid white !important;
              top: -3px !important;
              left: -3px !important;
            }
            .cropper-point.point-ne {
              border-top: 3px solid white !important;
              border-right: 3px solid white !important;
              top: -3px !important;
              right: -3px !important;
            }
            .cropper-point.point-sw {
              border-bottom: 3px solid white !important;
              border-left: 3px solid white !important;
              bottom: -3px !important;
              left: -3px !important;
            }
            .cropper-point.point-se {
              border-bottom: 3px solid white !important;
              border-right: 3px solid white !important;
              bottom: -3px !important;
              right: -3px !important;
            }
            /* Edges */
            .cropper-point.point-n,
            .cropper-point.point-s {
              width: 24px !important;
              height: 4px !important;
              background-color: white !important;
              left: 50% !important;
              transform: translateX(-50%) !important;
            }
            .cropper-point.point-n { top: -2px !important; }
            .cropper-point.point-s { bottom: -2px !important; }

            .cropper-point.point-e,
            .cropper-point.point-w {
              width: 4px !important;
              height: 24px !important;
              background-color: white !important;
              top: 50% !important;
              transform: translateY(-50%) !important;
            }
            .cropper-point.point-e { right: -2px !important; }
            .cropper-point.point-w { left: -2px !important; }
            
            /* Make the dashed lines a bit more subtle */
            .cropper-dashed {
              border-color: rgba(255, 255, 255, 0.5) !important;
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between p-4 text-white z-10 bg-gradient-to-b from-black/60 to-transparent shrink-0">
            <button onClick={onClose} className="p-2 -ml-2 active:scale-95 transition-transform">
              <X size={24} />
            </button>
            <span className="text-sm font-medium">裁剪图片</span>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="p-2 -mr-2 text-primary active:scale-95 transition-transform disabled:opacity-50"
            >
              <Check size={24} />
            </button>
          </div>

          {/* Cropper */}
          <div className="flex-1 w-full flex items-center justify-center overflow-hidden bg-black p-4">
            <Cropper
              src={imageSrc}
              style={{ height: '100%', width: '100%' }}
              initialAspectRatio={NaN} // Set dynamically in ready
              aspectRatio={NaN}
              guides={true}
              viewMode={1} // Restrict the crop box to not exceed the size of the canvas
              dragMode="move" // Allow moving the image, prevent drawing a new crop box
              autoCropArea={1} // 100% of the image
              background={false} // Hide the grid background
              responsive={true}
              checkOrientation={false}
              ready={handleImageReady}
              ref={cropperRef}
            />
          </div>

          {/* Footer Controls */}
          <div className="p-6 bg-black z-10 space-y-6 pb-safe shrink-0">
            {/* Bottom Actions */}
            <div className="flex items-center justify-between px-2">
              <button 
                onClick={handleRotate}
                className="p-2 text-white active:scale-95 transition-transform"
              >
                <RotateCcw size={20} />
              </button>
              <button 
                onClick={handleReset}
                className="p-2 text-white text-sm active:scale-95 transition-transform"
              >
                还原
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageCropperModal;
