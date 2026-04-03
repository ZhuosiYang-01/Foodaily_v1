import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import posthog from 'posthog-js';
import { Category, Work, RecordEntry, AppData, MonthlyStats } from '../types';
import { supabase } from '../lib/supabase';
import { fetchDataFromSupabase, syncDataToSupabase } from '../lib/syncService';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  addCategory: (category: Omit<Category, 'id' | 'order'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, force?: boolean) => void;
  moveWorksToCategory: (fromCategoryId: string, toCategoryId: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addRecord: (record: Omit<RecordEntry, 'id' | 'createdAt'>, workInfo: { name: string; categoryId: string; coverImage: string; isEmoji: boolean }) => string;
  batchAddRecords: (items: { record: Omit<RecordEntry, 'id' | 'createdAt'>, workInfo: { name: string; categoryId: string; coverImage: string; isEmoji: boolean } }[]) => void;
  updateRecord: (id: string, record: Partial<RecordEntry>, workInfo?: { name: string; categoryId: string }) => void;
  deleteRecord: (id: string) => void;
  updateWork: (id: string, work: Partial<Work>) => void;
  deleteWork: (id: string) => void;
  batchDeleteWorks: (ids: string[]) => void;
  batchMoveWorks: (workIds: string[], toCategoryId: string) => void;
  restoreLastDeleted: () => void;
  finalizeDelete: () => void;
  isUndoVisible: boolean;
  undoType: 'record' | 'work' | 'category' | 'works' | null;
  getMonthlyStats: (year: number, month: number) => MonthlyStats;
  search: (query: string) => { works: Work[]; records: RecordEntry[] };
  loadDemoData: () => void;
  exportData: () => string;
  importData: (json: string, mode: 'merge' | 'replace') => void;
  clearAllData: () => void;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
  currentUserId: string | null;
  syncNow: () => Promise<void>;
  mergeDuplicateWorks: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Configure localforage
localforage.config({
  name: 'Foodaily',
  storeName: 'app_data'
});

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '菜品', icon: '🍽️', supportsTaste: false, order: 0 },
  { id: 'cat-2', name: '烘焙', icon: '🥐', supportsTaste: true, order: 1 },
  { id: 'cat-3', name: '饮品', icon: '🥤', supportsTaste: false, order: 2 },
];

const INITIAL_WORKS: Work[] = [];
const INITIAL_RECORDS: RecordEntry[] = [];

const STORAGE_KEY = 'foodaily_v2_data';
const INITIALIZED_KEY = 'foodaily_v2_initialized';

// Pure helper: merge works with identical name+category, returns updated AppData
function deduplicateWorks(data: AppData): AppData {
  const now = Date.now();
  const groups = new Map<string, Work[]>();
  for (const w of data.works) {
    const key = `${w.categoryId}::${w.name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(w);
  }

  let updatedWorks = [...data.works];
  let updatedRecords = [...data.records];
  let hasDups = false;

  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    hasDups = true;
    const sorted = [...group].sort((a, b) => a.createdAt - b.createdAt);
    const canonical = sorted[0];
    const dupIds = new Set(sorted.slice(1).map(w => w.id));
    updatedRecords = updatedRecords.map(r => dupIds.has(r.workId) ? { ...r, workId: canonical.id } : r);
    updatedWorks = updatedWorks.filter(w => !dupIds.has(w.id));
  }

  if (!hasDups) return data;

  updatedWorks = updatedWorks.map(w => {
    if (w.isManualCover) return w;
    const recs = updatedRecords.filter(r => r.workId === w.id);
    if (!recs.length) return w;
    const latest = [...recs].sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      return d !== 0 ? d : b.createdAt - a.createdAt;
    })[0];
    return { ...w, coverImage: latest.mainImage, originalCoverImage: latest.originalMainImage, isEmojiCover: latest.isEmojiMain, updatedAt: now };
  });

  return { ...data, works: updatedWorks, records: updatedRecords };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>({
    categories: DEFAULT_CATEGORIES,
    works: INITIAL_WORKS,
    records: INITIAL_RECORDS
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const isSyncingFromCloud = useRef(false);
  const isSigningOut = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await localforage.getItem<AppData>(STORAGE_KEY);
        if (saved && saved.categories && saved.works && saved.records) {
          setData(saved);
        } else {
          // Fallback to localStorage if IndexedDB is empty (for migration)
          const legacySaved = localStorage.getItem(STORAGE_KEY);
          if (legacySaved) {
            const parsed = JSON.parse(legacySaved);
            setData(parsed);
            // Save to IndexedDB for future
            await localforage.setItem(STORAGE_KEY, parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load data from localforage', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (isLoading) return;
    
    const saveData = async () => {
      if (isSigningOut.current) return;
      try {
        await localforage.setItem(STORAGE_KEY, data);
      } catch (e) {
        console.error('Failed to save data to localforage', e);
      }
    };

    saveData();
  }, [data, isLoading]);

  // Listen to Supabase auth state: load data on login, clear on logout
  useEffect(() => {
    const loadFromCloud = async (userId: string) => {
      isSyncingFromCloud.current = true;
      setSyncStatus('syncing');
      const cloudData = await fetchDataFromSupabase(userId);
      if (cloudData) {
        // New user: no categories yet → initialize with defaults and sync to Supabase
        if (cloudData.categories.length === 0) {
          const localData = await localforage.getItem<AppData>(STORAGE_KEY);
          if (localData && (localData.works.length > 0 || localData.records.length > 0)) {
            // Local data exists but never synced (e.g. network failure) — retry sync, don't wipe
            const deduped = deduplicateWorks(localData);
            setData(deduped);
            await localforage.setItem(STORAGE_KEY, deduped);
            try { await syncDataToSupabase(userId, deduped); } catch { /* retry next time */ }
          } else {
            const initialData: AppData = {
              categories: DEFAULT_CATEGORIES,
              works: [],
              records: [],
            };
            setData(initialData);
            await localforage.setItem(STORAGE_KEY, initialData);
            try { await syncDataToSupabase(userId, initialData); } catch { /* retry next time */ }
          }
        } else {
          // Merge local + cloud: keep any local records/works not yet synced to cloud
          const localData = await localforage.getItem<AppData>(STORAGE_KEY);
          let merged: AppData;
          if (localData && (localData.works.length > 0 || localData.records.length > 0)) {
            const worksMap = new Map([
              ...localData.works.map(w => [w.id, w] as const),
              ...cloudData.works.map(w => [w.id, w] as const),
            ]);
            const recordsMap = new Map([
              ...localData.records.map(r => [r.id, r] as const),
              ...cloudData.records.map(r => [r.id, r] as const),
            ]);
            merged = {
              categories: cloudData.categories,
              works: Array.from(worksMap.values()),
              records: Array.from(recordsMap.values()),
            };
          } else {
            merged = cloudData;
          }
          const deduped = deduplicateWorks(merged);
          setData(deduped);
          await localforage.setItem(STORAGE_KEY, deduped);
        }
      }
      setSyncStatus('idle');
      isSyncingFromCloud.current = false;
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        loadFromCloud(session.user.id);
      } else {
        setCurrentUserId(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
        posthog.capture('user_logged_in');
        setCurrentUserId(session.user.id);
        loadFromCloud(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUserId(null);
        isSigningOut.current = true;
        setData({ categories: DEFAULT_CATEGORIES, works: [], records: [] });
        setTimeout(() => { isSigningOut.current = false; }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync immediately when page becomes hidden (tab switch, app backgrounded, refresh, close)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentUserId && !isSyncingFromCloud.current) {
        syncNow();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUserId]);

  // Debounced sync to Supabase after data changes
  useEffect(() => {
    if (!currentUserId || isLoading || isSyncingFromCloud.current || isUndoVisible) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        const updatedData = await syncDataToSupabase(currentUserId, data);
        // If images were uploaded (base64 → URL), update local data too
        if (updatedData !== data) {
          isSyncingFromCloud.current = true;
          setData(updatedData);
          await localforage.setItem(STORAGE_KEY, updatedData);
          isSyncingFromCloud.current = false;
        }
        setSyncError(null);
        setSyncStatus('idle');
        posthog.capture('sync_succeeded');
      } catch (e) {
        console.error('Sync failed:', e);
        const errMsg = e instanceof Error ? e.message : String(e);
        setSyncError(errMsg);
        setSyncStatus('error');
        posthog.capture('sync_failed', { error: errMsg });
      }
    }, 2000);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [data, currentUserId, isLoading]);

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
    workInfo: { name: string; categoryId: string; coverImage: string; originalCoverImage?: string; isEmoji: boolean }
  ) => {
    const recordId = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = Date.now();

    setData(prev => {
      let workId = record.workId;
      let updatedWorks = [...prev.works];
      let isNewWork = false;

      if (!workId) {
        // 尝试按名称匹配已有作品
        const existingWork = prev.works.find(w => w.name === workInfo.name && w.categoryId === workInfo.categoryId);
        if (existingWork) {
          workId = existingWork.id;
        } else {
          workId = typeof crypto.randomUUID === 'function' 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
          isNewWork = true;
          updatedWorks.push({
            id: workId,
            categoryId: workInfo.categoryId,
            name: workInfo.name,
            coverImage: workInfo.coverImage,
            originalCoverImage: workInfo.originalCoverImage,
            isEmojiCover: workInfo.isEmoji,
            isManualCover: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      const newRecord: RecordEntry = {
        ...record,
        id: recordId,
        workId,
        createdAt: now,
      };

      const allRecords = [newRecord, ...prev.records];

      // 重新评估作品封面
      const workRecords = allRecords.filter(r => r.workId === workId);
      const latestRecord = [...workRecords].sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.createdAt - a.createdAt;
      })[0];

      updatedWorks = updatedWorks.map(w => {
        if (w.id === workId) {
          const updatedWork = { ...w, updatedAt: now };
          if (!w.isManualCover && latestRecord) {
            updatedWork.coverImage = latestRecord.mainImage;
            updatedWork.originalCoverImage = latestRecord.originalMainImage;
            updatedWork.isEmojiCover = latestRecord.isEmojiMain;
          }
          return updatedWork;
        }
        return w;
      });

      return {
        ...prev,
        works: updatedWorks,
        records: allRecords,
      };
    });

    localStorage.setItem(INITIALIZED_KEY, 'true');
    posthog.capture('record_created', {
      hasImage: !record.isEmojiMain && !!record.mainImage,
      isEmoji: record.isEmojiMain,
      hasEvaluation: !!record.evaluation,
      hasNotes: !!record.notes,
      hasExtraImages: record.extraImages?.length > 0,
      categoryId: workInfo.categoryId,
    });
    return recordId;
  };

  const batchAddRecords = (items: { record: Omit<RecordEntry, 'id' | 'createdAt'>, workInfo: { name: string; categoryId: string; coverImage: string; isEmoji: boolean } }[]) => {
    const now = Date.now();

    setData(prev => {
      let updatedWorks = [...prev.works];
      let newRecords: RecordEntry[] = [];

      for (const item of items) {
        const { record, workInfo } = item;
        const recordId = typeof crypto.randomUUID === 'function' 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2) + Date.now().toString(36);

        let workId = record.workId;

        if (!workId) {
          const existingWork = updatedWorks.find(w => w.name === workInfo.name && w.categoryId === workInfo.categoryId);
          if (existingWork) {
            workId = existingWork.id;
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
        }

        newRecords.push({
          ...record,
          id: recordId,
          workId,
          createdAt: now,
        });
      }

      const allRecords = [...newRecords, ...prev.records];
      const affectedWorkIds = new Set(newRecords.map(r => r.workId));

      updatedWorks = updatedWorks.map(w => {
        if (affectedWorkIds.has(w.id)) {
          const updatedWork = { ...w, updatedAt: now };
          if (!w.isManualCover) {
            const workRecords = allRecords.filter(r => r.workId === w.id);
            const latestRecord = [...workRecords].sort((a, b) => {
              const dateDiff = b.date.localeCompare(a.date);
              if (dateDiff !== 0) return dateDiff;
              return b.createdAt - a.createdAt;
            })[0];
            if (latestRecord) {
              updatedWork.coverImage = latestRecord.mainImage;
              updatedWork.originalCoverImage = latestRecord.originalMainImage;
              updatedWork.isEmojiCover = latestRecord.isEmojiMain;
            }
          }
          return updatedWork;
        }
        return w;
      });

      return {
        ...prev,
        works: updatedWorks,
        records: allRecords,
      };
    });

    localStorage.setItem(INITIALIZED_KEY, 'true');
    posthog.capture('batch_import_completed', { count: items.length });
  };

  const updateRecord = (id: string, record: Partial<RecordEntry>, workInfo?: { name: string; categoryId: string }) => {
    setData(prev => {
      let updatedRecords = [...prev.records];
      let updatedWorks = [...prev.works];
      const now = Date.now();

      const recordToUpdate = prev.records.find(r => r.id === id);
      if (!recordToUpdate) return prev;

      const oldWorkId = recordToUpdate.workId;
      let newWorkId = record.workId || oldWorkId;

      // 如果提供了 workInfo，说明可能需要更换作品
      if (workInfo) {
        const existingWork = prev.works.find(w => w.name === workInfo.name && w.categoryId === workInfo.categoryId);
        
        if (existingWork) {
          newWorkId = existingWork.id;
        } else {
          // 创建新作品
          newWorkId = crypto.randomUUID();
          updatedWorks.push({
            id: newWorkId,
            categoryId: workInfo.categoryId,
            name: workInfo.name,
            coverImage: record.mainImage || recordToUpdate.mainImage,
            originalCoverImage: record.originalMainImage || recordToUpdate.originalMainImage,
            isEmojiCover: record.isEmojiMain ?? recordToUpdate.isEmojiMain,
            isManualCover: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // 更新记录
      updatedRecords = updatedRecords.map(r => r.id === id ? { ...r, ...record, workId: newWorkId } : r);

      // 重新评估受影响作品的封面
      const affectedWorkIds = Array.from(new Set([oldWorkId, newWorkId]));
      
      updatedWorks = updatedWorks.map(w => {
        if (affectedWorkIds.includes(w.id)) {
          const updatedWork = { ...w, updatedAt: now };
          if (!w.isManualCover) {
            const workRecords = updatedRecords.filter(r => r.workId === w.id);
            const latestRecord = [...workRecords].sort((a, b) => {
              const dateDiff = b.date.localeCompare(a.date);
              if (dateDiff !== 0) return dateDiff;
              return b.createdAt - a.createdAt;
            })[0];
            
            if (latestRecord) {
              updatedWork.coverImage = latestRecord.mainImage;
              updatedWork.originalCoverImage = latestRecord.originalMainImage;
              updatedWork.isEmojiCover = latestRecord.isEmojiMain;
            }
          }
          return updatedWork;
        }
        return w;
      });

      // If the work changed and old work now has 0 remaining records, remove it
      if (oldWorkId !== newWorkId) {
        const remainingForOldWork = updatedRecords.filter(r => r.workId === oldWorkId);
        if (remainingForOldWork.length === 0) {
          updatedWorks = updatedWorks.filter(w => w.id !== oldWorkId);
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
    type: 'record' | 'work' | 'category' | 'works'; 
    data: any; 
    relatedRecords?: RecordEntry[]; 
    relatedWork?: Work;
    relatedWorks?: Work[];
  } | null>(null);
  const [isUndoVisible, setIsUndoVisible] = useState(false);
  const [undoType, setUndoType] = useState<'record' | 'work' | 'category' | 'works' | null>(null);

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
          const latestRecord = [...remainingRecordsForWork].sort((a, b) => {
            const dateDiff = b.date.localeCompare(a.date);
            if (dateDiff !== 0) return dateDiff;
            return b.createdAt - a.createdAt;
          })[0];
          if (latestRecord) {
            updatedWorks = prev.works.map(w => w.id === workId ? {
              ...w,
              coverImage: latestRecord.mainImage,
              originalCoverImage: latestRecord.originalMainImage,
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

  const batchDeleteWorks = (ids: string[]) => {
    const worksToDelete = data.works.filter(w => ids.includes(w.id));
    if (worksToDelete.length === 0) return;

    const relatedRecords = data.records.filter(r => ids.includes(r.workId));
    
    setLastDeleted({ type: 'works', data: worksToDelete, relatedRecords });
    setUndoType('works');
    setIsUndoVisible(true);

    setData(prev => ({
      ...prev,
      works: prev.works.filter(w => !ids.includes(w.id)),
      records: prev.records.filter(r => !ids.includes(r.workId)),
    }));
  };

  const batchMoveWorks = (workIds: string[], toCategoryId: string) => {
    setData(prev => ({
      ...prev,
      works: prev.works.map(w => workIds.includes(w.id) ? { ...w, categoryId: toCategoryId } : w)
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

        const allRecords = [restoredRecord, ...prev.records];
        const workId = restoredRecord.workId;

        // 恢复后也要重新评估封面
        newWorks = newWorks.map(w => {
          if (w.id === workId && !w.isManualCover) {
            const workRecords = allRecords.filter(r => r.workId === workId);
            const latestRecord = [...workRecords].sort((a, b) => {
              const dateDiff = b.date.localeCompare(a.date);
              if (dateDiff !== 0) return dateDiff;
              return b.createdAt - a.createdAt;
            })[0];
            if (latestRecord) {
              return {
                ...w,
                coverImage: latestRecord.mainImage,
                originalCoverImage: latestRecord.originalMainImage,
                isEmojiCover: latestRecord.isEmojiMain
              };
            }
          }
          return w;
        });

        return {
          ...prev,
          works: newWorks,
          records: allRecords
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
      } else if (lastDeleted.type === 'works') {
        const restoredWorks = lastDeleted.data as Work[];
        const restoredRecords = lastDeleted.relatedRecords || [];
        
        return {
          ...prev,
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
    // Immediately delete from Supabase before clearing lastDeleted
    if (lastDeleted && currentUserId) {
      const toDelete = lastDeleted;
      (async () => {
        try {
          if (toDelete.type === 'record') {
            const record = toDelete.data as RecordEntry;
            const recordIds = [record.id];
            // If this was the last record for its work, the work was also removed locally
            const workIds = toDelete.relatedWork ? [toDelete.relatedWork.id] : [];
            await Promise.all([
              supabase.from('records').delete().in('id', recordIds),
              workIds.length > 0 ? supabase.from('works').delete().in('id', workIds) : Promise.resolve(),
            ]);
          } else if (toDelete.type === 'work') {
            const work = toDelete.data as Work;
            const relatedRecords = toDelete.relatedRecords ?? [];
            const recordIds = relatedRecords.map(r => r.id);
            await Promise.all([
              supabase.from('works').delete().eq('id', work.id),
              recordIds.length > 0 ? supabase.from('records').delete().in('id', recordIds) : Promise.resolve(),
            ]);
          } else if (toDelete.type === 'works') {
            const works = toDelete.data as Work[];
            const workIds = works.map(w => w.id);
            const relatedRecords = toDelete.relatedRecords ?? [];
            const recordIds = relatedRecords.map(r => r.id);
            await Promise.all([
              supabase.from('works').delete().in('id', workIds),
              recordIds.length > 0 ? supabase.from('records').delete().in('id', recordIds) : Promise.resolve(),
            ]);
          } else if (toDelete.type === 'category') {
            const category = toDelete.data as Category;
            const relatedWorks = toDelete.relatedWorks ?? [];
            const workIds = relatedWorks.map(w => w.id);
            const relatedRecords = toDelete.relatedRecords ?? [];
            const recordIds = relatedRecords.map(r => r.id);
            await Promise.all([
              supabase.from('categories').delete().eq('id', category.id),
              workIds.length > 0 ? supabase.from('works').delete().in('id', workIds) : Promise.resolve(),
              recordIds.length > 0 ? supabase.from('records').delete().in('id', recordIds) : Promise.resolve(),
            ]);
          }
        } catch (e) {
          console.error('finalizeDelete: Supabase delete failed', e);
        }
      })();
    }

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
    ).sort((a, b) => b.date.localeCompare(a.date));
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

  const syncNow = async () => {
    if (!currentUserId) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncStatus('syncing');
    try {
      const latest = dataRef.current;
      const updatedData = await syncDataToSupabase(currentUserId, latest);
      if (updatedData !== latest) {
        isSyncingFromCloud.current = true;
        setData(updatedData);
        await localforage.setItem(STORAGE_KEY, updatedData);
        isSyncingFromCloud.current = false;
      }
      setSyncError(null);
      setSyncStatus('idle');
    } catch (e) {
      console.error('Sync failed:', e);
      setSyncError(e instanceof Error ? e.message : String(e));
      setSyncStatus('error');
    }
  };

  const mergeDuplicateWorks = (): void => {
    setData(prev => deduplicateWorks(prev));
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
      isLoading,
      addCategory,
      updateCategory,
      deleteCategory,
      reorderCategories,
      addRecord,
      batchAddRecords,
      updateRecord,
      deleteRecord,
      updateWork,
      deleteWork,
      batchDeleteWorks,
      batchMoveWorks,
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
      clearAllData,
      syncStatus,
      syncError,
      currentUserId,
      syncNow,
      mergeDuplicateWorks,
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
