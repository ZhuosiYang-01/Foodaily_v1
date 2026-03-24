import React, { createContext, useContext, useState, useEffect } from 'react';
import { Category, Work, RecordEntry, AppData, MonthlyStats } from '../types';

interface AppContextType {
  data: AppData;
  addCategory: (category: Omit<Category, 'id' | 'order'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, force?: boolean) => void;
  moveWorksToCategory: (fromCategoryId: string, toCategoryId: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addRecord: (record: Omit<RecordEntry, 'id' | 'createdAt'>, workInfo: { name: string; categoryId: string; coverImage: string; isEmoji: boolean }) => string;
  updateRecord: (id: string, record: Partial<RecordEntry>, workInfo?: { name: string; categoryId: string }) => void;
  deleteRecord: (id: string) => void;
  updateWork: (id: string, work: Partial<Work>) => void;
  deleteWork: (id: string) => void;
  restoreLastDeleted: () => void;
  finalizeDelete: () => void;
  isUndoVisible: boolean;
  undoType: 'record' | 'work' | 'category' | null;
  getMonthlyStats: (year: number, month: number) => MonthlyStats;
  search: (query: string) => { works: Work[]; records: RecordEntry[] };
  loadDemoData: () => void;
  exportData: () => string;
  importData: (json: string, mode: 'merge' | 'replace') => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '菜品', icon: '🍽️', supportsTaste: false, order: 0 },
  { id: 'cat-2', name: '烘焙', icon: '🥐', supportsTaste: true, order: 1 },
  { id: 'cat-3', name: '饮品', icon: '🥤', supportsTaste: false, order: 2 },
];

const INITIAL_WORKS: Work[] = [];

const INITIAL_RECORDS: RecordEntry[] = [];

const STORAGE_KEY = 'foodaily_v2_data';
const INITIALIZED_KEY = 'foodaily_v2_initialized';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.categories && parsed.works && parsed.records) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return { categories: DEFAULT_CATEGORIES, works: INITIAL_WORKS, records: INITIAL_RECORDS };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        alert('存储空间已满，无法保存更多照片。请尝试删除一些旧记录或减小照片大小。');
      }
    }
  }, [data]);

  useEffect(() => {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    if (!initialized) {
      // 强制清空一次旧版本的数据（如果有的话）
      localStorage.removeItem('foodaily_data');
      localStorage.removeItem('foodaily_initialized');
      
      localStorage.setItem(INITIALIZED_KEY, 'true');
      // 确保当前状态也是空的
      if (data.works.length > 0 || data.records.length > 0) {
        setData({ categories: DEFAULT_CATEGORIES, works: [], records: [] });
      }
    }
  }, []);

  const addCategory = (category: Omit<Category, 'id' | 'order'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      order: data.categories.length,
    };
    setData(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  };

  const updateCategory = (id: string, category: Partial<Category>) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...category } : c),
    }));
  };

  const deleteCategory = (id: string, force: boolean = false) => {
    const categoryToDelete = data.categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    let relatedWorks: Work[] = [];
    let relatedRecords: RecordEntry[] = [];

    if (force) {
      relatedWorks = data.works.filter(w => w.categoryId === id);
      const workIds = relatedWorks.map(w => w.id);
      relatedRecords = data.records.filter(r => workIds.includes(r.workId));
    }

    setLastDeleted({ 
      type: 'category', 
      data: categoryToDelete, 
      relatedWorks, 
      relatedRecords 
    });
    setUndoType('category');
    setIsUndoVisible(true);

    setData(prev => {
      const updatedCategories = prev.categories.filter(c => c.id !== id);
      let updatedWorks = prev.works;
      let updatedRecords = prev.records;

      if (force) {
        const workIds = relatedWorks.map(w => w.id);
        updatedWorks = prev.works.filter(w => w.categoryId !== id);
        updatedRecords = prev.records.filter(r => !workIds.includes(r.workId));
      }

      return {
        ...prev,
        categories: updatedCategories,
        works: updatedWorks,
        records: updatedRecords
      };
    });
  };

  const moveWorksToCategory = (fromCategoryId: string, toCategoryId: string) => {
    setData(prev => ({
      ...prev,
      works: prev.works.map(w => w.categoryId === fromCategoryId ? { ...w, categoryId: toCategoryId } : w)
    }));
  };

  const reorderCategories = (newCategories: Category[]) => {
    setData(prev => ({
      ...prev,
      categories: newCategories.map((c, index) => ({ ...c, order: index })),
    }));
  };

  const addRecord = (
    record: Omit<RecordEntry, 'id' | 'createdAt'>,
    workInfo: { name: string; categoryId: string; coverImage: string; isEmoji: boolean }
  ) => {
    const recordId = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = Date.now();

    setData(prev => {
      let workId = record.workId;
      let updatedWorks = [...prev.works];

      if (!workId) {
        // 尝试按名称匹配已有作品
        const existingWork = prev.works.find(w => w.name === workInfo.name && w.categoryId === workInfo.categoryId);
        if (existingWork) {
          workId = existingWork.id;
          updatedWorks = updatedWorks.map(w => w.id === workId ? { 
            ...w, 
            updatedAt: now,
            coverImage: w.isManualCover ? w.coverImage : workInfo.coverImage,
            isEmojiCover: w.isManualCover ? w.isEmojiCover : workInfo.isEmoji
          } : w);
        } else {
          workId = typeof crypto.randomUUID === 'function' 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
          updatedWorks.push({
            id: workId,
            categoryId: workInfo.categoryId,
            name: workInfo.name,
            coverImage: workInfo.coverImage,
            isEmojiCover: workInfo.isEmoji,
            isManualCover: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      } else {
        updatedWorks = updatedWorks.map(w => w.id === workId ? { 
          ...w, 
          updatedAt: now,
          coverImage: w.isManualCover ? w.coverImage : workInfo.coverImage,
          isEmojiCover: w.isManualCover ? w.isEmojiCover : workInfo.isEmoji
        } : w);
      }

      const newRecord: RecordEntry = {
        ...record,
        id: recordId,
        workId,
        createdAt: now,
      };

      return {
        ...prev,
        works: updatedWorks,
        records: [newRecord, ...prev.records],
      };
    });

    localStorage.setItem(INITIALIZED_KEY, 'true');
    return recordId;
  };

  const updateRecord = (id: string, record: Partial<RecordEntry>, workInfo?: { name: string; categoryId: string }) => {
    setData(prev => {
      let updatedRecords = [...prev.records];
      let updatedWorks = [...prev.works];
      const now = Date.now();

      const recordToUpdate = prev.records.find(r => r.id === id);
      if (!recordToUpdate) return prev;

      let newWorkId = record.workId || recordToUpdate.workId;

      // 如果提供了 workInfo，说明可能需要更换作品
      if (workInfo) {
        const oldWorkId = recordToUpdate.workId;
        const existingWork = prev.works.find(w => w.name === workInfo.name && w.categoryId === workInfo.categoryId);
        
        if (existingWork) {
          newWorkId = existingWork.id;
          // 更新已有作品的 updatedAt 和封面（如果需要）
          updatedWorks = updatedWorks.map(w => w.id === newWorkId ? {
            ...w,
            updatedAt: now,
            coverImage: w.isManualCover ? w.coverImage : (record.mainImage || recordToUpdate.mainImage),
            isEmojiCover: w.isManualCover ? w.isEmojiCover : (record.isEmojiMain ?? recordToUpdate.isEmojiMain)
          } : w);
        } else {
          // 创建新作品
          newWorkId = crypto.randomUUID();
          updatedWorks.push({
            id: newWorkId,
            categoryId: workInfo.categoryId,
            name: workInfo.name,
            coverImage: record.mainImage || recordToUpdate.mainImage,
            isEmojiCover: record.isEmojiMain ?? recordToUpdate.isEmojiMain,
            isManualCover: false,
            createdAt: now,
            updatedAt: now,
          });
        }

        // 如果作品发生了变化，处理旧作品的封面
        if (newWorkId !== oldWorkId) {
          const oldWork = updatedWorks.find(w => w.id === oldWorkId);
          if (oldWork && !oldWork.isManualCover) {
            // 找出旧作品剩余的记录（排除当前正在更新的这条）
            const remainingRecords = updatedRecords.filter(r => r.workId === oldWorkId && r.id !== id);
            const latestRecord = [...remainingRecords].sort((a, b) => b.date.localeCompare(a.date))[0];
            
            if (latestRecord) {
              updatedWorks = updatedWorks.map(w => w.id === oldWorkId ? {
                ...w,
                coverImage: latestRecord.mainImage,
                isEmojiCover: latestRecord.isEmojiMain
              } : w);
            }
          }
        }
      }

      // 更新记录
      updatedRecords = updatedRecords.map(r => r.id === id ? { ...r, ...record, workId: newWorkId } : r);

      // 如果更新了图片，且该记录是所属作品的最新记录，且作品封面不是手动设置的，则更新作品封面
      if ('mainImage' in record || 'isEmojiMain' in record || workInfo) {
        const targetRecord = updatedRecords.find(r => r.id === id);
        if (targetRecord) {
          const work = updatedWorks.find(w => w.id === targetRecord.workId);
          if (work && !work.isManualCover) {
            // 检查是否是最新记录（按日期排序）
            const workRecords = updatedRecords.filter(r => r.workId === work.id);
            const latestRecord = [...workRecords].sort((a, b) => b.date.localeCompare(a.date))[0];
            
            if (latestRecord && latestRecord.id === id) {
              updatedWorks = updatedWorks.map(w => w.id === work.id ? {
                ...w,
                coverImage: targetRecord.mainImage,
                isEmojiCover: targetRecord.isEmojiMain
              } : w);
            }
          }
        }
      }

      return {
        ...prev,
        records: updatedRecords,
        works: updatedWorks
      };
    });
  };

  const [lastDeleted, setLastDeleted] = useState<{ 
    type: 'record' | 'work' | 'category'; 
    data: any; 
    relatedRecords?: RecordEntry[]; 
    relatedWork?: Work;
    relatedWorks?: Work[];
  } | null>(null);
  const [isUndoVisible, setIsUndoVisible] = useState(false);
  const [undoType, setUndoType] = useState<'record' | 'work' | 'category' | null>(null);

  const deleteRecord = (id: string) => {
    const recordToDelete = data.records.find(r => r.id === id);
    if (!recordToDelete) return;

    const workId = recordToDelete.workId;
    const work = data.works.find(w => w.id === workId);
    
    // 检查是否是该作品的最后一条记录
    const remainingRecordsForWork = data.records.filter(r => r.workId === workId && r.id !== id);
    const isLastRecord = remainingRecordsForWork.length === 0;

    if (isLastRecord) {
      setLastDeleted({ type: 'record', data: recordToDelete, relatedWork: work });
    } else {
      setLastDeleted({ type: 'record', data: recordToDelete });
    }

    setUndoType('record');
    setIsUndoVisible(true);

    setData(prev => {
      const updatedRecords = prev.records.filter(r => r.id !== id);
      let updatedWorks = prev.works;

      if (isLastRecord) {
        updatedWorks = prev.works.filter(w => w.id !== workId);
      } else {
        // 如果还有剩余记录，更新封面（如果需要）
        const currentWork = prev.works.find(w => w.id === workId);
        if (currentWork && !currentWork.isManualCover) {
          const latestRecord = [...remainingRecordsForWork].sort((a, b) => b.date.localeCompare(a.date))[0];
          if (latestRecord) {
            updatedWorks = prev.works.map(w => w.id === workId ? {
              ...w,
              coverImage: latestRecord.mainImage,
              isEmojiCover: latestRecord.isEmojiMain
            } : w);
          }
        }
      }

      return {
        ...prev,
        records: updatedRecords,
        works: updatedWorks
      };
    });
  };

  const updateWork = (id: string, work: Partial<Work>) => {
    setData(prev => ({
      ...prev,
      works: prev.works.map(w => {
        if (w.id === id) {
          const updatedWork = { ...w, ...work };
          // 只有当封面图或封面类型真正发生变化时，才标记为手动
          if (('coverImage' in work && work.coverImage !== w.coverImage) || 
              ('isEmojiCover' in work && work.isEmojiCover !== w.isEmojiCover)) {
            updatedWork.isManualCover = true;
          }
          return updatedWork;
        }
        return w;
      }),
    }));
  };

  const deleteWork = (id: string) => {
    const workToDelete = data.works.find(w => w.id === id);
    if (!workToDelete) return;

    const relatedRecords = data.records.filter(r => r.workId === id);
    
    setLastDeleted({ type: 'work', data: workToDelete, relatedRecords });
    setUndoType('work');
    setIsUndoVisible(true);

    setData(prev => ({
      ...prev,
      works: prev.works.filter(w => w.id !== id),
      records: prev.records.filter(r => r.workId !== id),
    }));
  };

  const restoreLastDeleted = () => {
    if (!lastDeleted) return;

    setData(prev => {
      if (lastDeleted.type === 'record') {
        const restoredRecord = lastDeleted.data as RecordEntry;
        const relatedWork = lastDeleted.relatedWork as Work | undefined;
        
        let newWorks = prev.works;
        if (relatedWork && !prev.works.some(w => w.id === relatedWork.id)) {
          newWorks = [...prev.works, relatedWork];
        }

        // 确保作品还存在（要么本来就在，要么刚才恢复了）
        const workExists = newWorks.some(w => w.id === restoredRecord.workId);
        if (!workExists) return prev;

        return {
          ...prev,
          works: newWorks,
          records: [restoredRecord, ...prev.records]
        };
      } else if (lastDeleted.type === 'work') {
        const restoredWork = lastDeleted.data as Work;
        const restoredRecords = lastDeleted.relatedRecords || [];
        
        return {
          ...prev,
          works: [...prev.works, restoredWork],
          records: [...prev.records, ...restoredRecords]
        };
      } else if (lastDeleted.type === 'category') {
        const restoredCategory = lastDeleted.data as Category;
        const restoredWorks = lastDeleted.relatedWorks || [];
        const restoredRecords = lastDeleted.relatedRecords || [];

        return {
          ...prev,
          categories: [...prev.categories, restoredCategory],
          works: [...prev.works, ...restoredWorks],
          records: [...prev.records, ...restoredRecords]
        };
      }
      return prev;
    });

    setLastDeleted(null);
    setIsUndoVisible(false);
    setUndoType(null);
  };

  const finalizeDelete = () => {
    setLastDeleted(null);
    setIsUndoVisible(false);
    setUndoType(null);
  };

  const getMonthlyStats = (year: number, month: number): MonthlyStats => {
    const stats: MonthlyStats = {};
    data.categories.forEach(c => stats[c.name] = 0);

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    data.records.forEach(r => {
      if (r.date.startsWith(monthStr)) {
        const work = data.works.find(w => w.id === r.workId);
        const category = data.categories.find(c => c.id === work?.categoryId);
        if (category) {
          stats[category.name] = (stats[category.name] || 0) + 1;
        }
      }
    });

    return stats;
  };

  const search = (query: string) => {
    const q = query.toLowerCase();
    const works = data.works.filter(w => w.name.toLowerCase().includes(q));
    const records = data.records.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.evaluation.toLowerCase().includes(q) || 
      r.notes.toLowerCase().includes(q)
    );
    return { works, records };
  };

  const exportData = () => JSON.stringify(data);

  const importData = (json: string, mode: 'merge' | 'replace') => {
    try {
      const imported: AppData = JSON.parse(json);
      if (mode === 'replace') {
        setData(imported);
        if (imported.works.length > 0 || imported.records.length > 0) {
          localStorage.setItem(INITIALIZED_KEY, 'true');
        }
      } else {
        // 简单合并逻辑：合并分类、作品和记录，去重
        setData(prev => ({
          categories: [...prev.categories, ...imported.categories.filter(ic => !prev.categories.find(pc => pc.id === ic.id))],
          works: [...prev.works, ...imported.works.filter(iw => !prev.works.find(pw => pw.id === iw.id))],
          records: [...prev.records, ...imported.records.filter(ir => !prev.records.find(pr => pr.id === ir.id))],
        }));
        localStorage.setItem(INITIALIZED_KEY, 'true');
      }
    } catch (e) {
      console.error('Import error:', e);
      throw e;
    }
  };

  const clearAllData = () => {
    setData({ categories: DEFAULT_CATEGORIES, works: [], records: [] });
    localStorage.removeItem('foodaily_initialized');
  };

  const loadDemoData = () => {
    setData({
      categories: DEFAULT_CATEGORIES,
      works: INITIAL_WORKS,
      records: INITIAL_RECORDS
    });
    localStorage.setItem(INITIALIZED_KEY, 'true');
  };

  return (
    <AppContext.Provider value={{
      data,
      addCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,
      addRecord,
      updateRecord,
      deleteRecord,
      updateWork,
      deleteWork,
      restoreLastDeleted,
      finalizeDelete,
      isUndoVisible,
      undoType,
      moveWorksToCategory,
      getMonthlyStats,
      search,
      loadDemoData,
      exportData,
      importData,
      clearAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
