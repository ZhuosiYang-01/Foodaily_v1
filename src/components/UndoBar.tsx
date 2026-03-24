import React from 'react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

const UndoBar = () => {
  const { isUndoVisible, undoType, restoreLastDeleted, finalizeDelete } = useApp();

  const typeLabels = {
    record: '记录',
    work: '作品',
    category: '分类'
  };

  return (
    <AnimatePresence>
      {isUndoVisible && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={finalizeDelete}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-50 p-8 pb-10 border-t border-gray-50"
          >
            <div className="max-w-md mx-auto space-y-8">
              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-gray-900 serif">已删除{undoType ? typeLabels[undoType] : ''}</p>
                <p className="text-sm text-gray-400">您可以撤销此操作或点击完成</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={restoreLastDeleted}
                  className="rounded-2xl h-14 text-sm font-bold uppercase tracking-widest border-gray-100 hover:bg-gray-50"
                >
                  撤销
                </Button>
                <Button
                  onClick={finalizeDelete}
                  className="rounded-2xl h-14 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  完成
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UndoBar;
