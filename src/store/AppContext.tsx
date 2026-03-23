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
  updateRecord: (id: string, record: Partial<RecordEntry>) => void;
  deleteRecord: (id: string) => void;
  updateWork: (id: string, work: Partial<Work>) => void;
  deleteWork: (id: string) => void;
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

const INITIAL_WORKS: Work[] = [
  { id: 'w-1', categoryId: 'cat-1', name: '炸鸡', coverImage: '🍗', isEmojiCover: true, createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 86400000 * 2 },
  { id: 'w-2', categoryId: 'cat-1', name: '手抓饼', coverImage: '🫓', isEmojiCover: true, createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 5 },
  { id: 'w-3', categoryId: 'cat-2', name: '蛋挞', coverImage: '🥧', isEmojiCover: true, createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3 },
  { id: 'w-4', categoryId: 'cat-3', name: '奶茶', coverImage: '🧋', isEmojiCover: true, createdAt: Date.now() - 86400000 * 1, updatedAt: Date.now() - 86400000 * 1 },
];

const INITIAL_RECORDS: RecordEntry[] = [
  { id: 'r-1', workId: 'w-1', date: new Date().toISOString().split('T')[0], title: '脆皮炸鸡', evaluation: '外酥里嫩，火候刚好', notes: '下次多加点辣椒粉', mainImage: '🍗', isEmojiMain: true, extraImages: [], createdAt: Date.now() - 3600000 },
  { id: 'r-2', workId: 'w-2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], title: '全家福手抓饼', evaluation: '加了两个蛋，非常满足', notes: '酱汁刷得有点多', mainImage: '🫓', isEmojiMain: true, extraImages: [], createdAt: Date.now() - 86400000 - 3600000 },
  { id: 'r-3', workId: 'w-3', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], title: '葡式蛋挞', evaluation: '奶香浓郁，皮很酥', notes: '烤箱温度可以再高5度', mainImage: '🥧', isEmojiMain: true, extraImages: [], createdAt: Date.now() - 86400000 * 2 - 3600000 },
  { id: 'r-4', workId: 'w-4', date: new Date().toISOString().split('T')[0], title: '珍珠奶茶', evaluation: '珍珠很Q弹', notes: '三分糖刚好', mainImage: '🧋', isEmojiMain: true, extraImages: [], createdAt: Date.now() - 1800000 },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('foodaily_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 确保基本结构完整
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
    localStorage.setItem('foodaily_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const initialized = localStorage.getItem('foodaily_initialized');
    if (!initialized && data.works.length === 0 && data.records.length === 0) {
      loadDemoData();
      localStorage.setItem('foodaily_initialized', 'true');
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
    setData(prev => {
      if (!force) {
        return {
          ...prev,
          categories: prev.categories.filter(c => c.id !== id),
        };
      }

      // 强制删除模式：找出所有属于该分类的作品 ID
      const workIdsToDelete = prev.works
        .filter(w => w.categoryId === id)
        .map(w => w.id);

      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
        works: prev.works.filter(w => w.categoryId !== id),
        records: prev.records.filter(r => !workIdsToDelete.includes(r.workId)),
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
    const recordId = crypto.randomUUID();
    const now = Date.now();

    // 查找或创建作品
    let workId = record.workId;
    let updatedWorks = [...data.works];

    if (!workId) {
      // 尝试按名称匹配已有作品
      const existingWork = data.works.find(w => w.name === workInfo.name && w.categoryId === workInfo.categoryId);
      if (existingWork) {
        workId = existingWork.id;
      } else {
        workId = crypto.randomUUID();
        updatedWorks.push({
          id: workId,
          categoryId: workInfo.categoryId,
          name: workInfo.name,
          coverImage: workInfo.coverImage,
          isEmojiCover: workInfo.isEmoji,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // 更新已有作品的 updatedAt
      updatedWorks = updatedWorks.map(w => w.id === workId ? { ...w, updatedAt: now } : w);
    }

    const newRecord: RecordEntry = {
      ...record,
      id: recordId,
      workId,
      createdAt: now,
    };

    setData(prev => ({
      ...prev,
      works: updatedWorks,
      records: [newRecord, ...prev.records],
    }));
    localStorage.setItem('foodaily_initialized', 'true');

    return recordId;
  };

  const updateRecord = (id: string, record: Partial<RecordEntry>) => {
    setData(prev => ({
      ...prev,
      records: prev.records.map(r => r.id === id ? { ...r, ...record } : r),
    }));
  };

  const deleteRecord = (id: string) => {
    setData(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== id),
    }));
  };

  const updateWork = (id: string, work: Partial<Work>) => {
    setData(prev => ({
      ...prev,
      works: prev.works.map(w => w.id === id ? { ...w, ...work } : w),
    }));
  };

  const deleteWork = (id: string) => {
    setData(prev => ({
      ...prev,
      works: prev.works.filter(w => w.id !== id),
      records: prev.records.filter(r => r.workId !== id),
    }));
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
          localStorage.setItem('foodaily_initialized', 'true');
        }
      } else {
        // 简单合并逻辑：合并分类、作品和记录，去重
        setData(prev => ({
          categories: [...prev.categories, ...imported.categories.filter(ic => !prev.categories.find(pc => pc.id === ic.id))],
          works: [...prev.works, ...imported.works.filter(iw => !prev.works.find(pw => pw.id === iw.id))],
          records: [...prev.records, ...imported.records.filter(ir => !prev.records.find(pr => pr.id === ir.id))],
        }));
        localStorage.setItem('foodaily_initialized', 'true');
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
    localStorage.setItem('foodaily_initialized', 'true');
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
