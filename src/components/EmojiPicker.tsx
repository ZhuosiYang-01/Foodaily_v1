import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Check } from 'lucide-react';
import { FOOD_EMOJIS } from '../constants/emojis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onClose, onSelect, currentEmoji }) => {
  const [activeCategory, setActiveCategory] = useState(FOOD_EMOJIS[0].category);
  const [customEmoji, setCustomEmoji] = useState('');

  if (!isOpen) return null;

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmoji.trim()) {
      onSelect(customEmoji.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-background rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-6 pb-4 flex items-center justify-between border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">选择图标</h3>
              <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex-shrink-0 w-full border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex gap-2 overflow-x-auto px-6 py-3 no-scrollbar">
                {FOOD_EMOJIS.map((group) => (
                  <button
                    key={group.category}
                    onClick={() => setActiveCategory(group.category)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                      activeCategory === group.category
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-accent text-muted-foreground hover:bg-accent/80"
                    )}
                  >
                    {group.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Grid */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-5 gap-4 min-h-0">
              {FOOD_EMOJIS.find(g => g.category === activeCategory)?.emojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  onClick={() => handleSelect(emoji)}
                  className={cn(
                    "aspect-square flex items-center justify-center text-3xl rounded-2xl transition-all hover:scale-110 active:scale-95",
                    currentEmoji === emoji ? "bg-primary/10 ring-2 ring-primary" : "bg-accent/50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex-shrink-0 p-6 pt-4 border-t border-border/50 bg-accent/20">
              <form onSubmit={handleCustomSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="或输入自定义 Emoji..."
                    className="rounded-2xl h-12 pl-4 pr-10 text-xs border-none bg-background shadow-inner"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={!customEmoji.trim()}
                  className="rounded-2xl h-12 px-6 text-xs font-bold uppercase tracking-widest"
                >
                  确定
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmojiPicker;
