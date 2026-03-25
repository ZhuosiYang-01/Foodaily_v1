import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ArrowUpDown, History, Star, Calendar, CheckCircle2, Circle, Trash2, FolderInput, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn, formatDate } from '@/lib/utils';

type SortType = 'recent' | 'most_frequent' | 'first_time';

const CategoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, batchDeleteWorks, batchMoveWorks } = useApp();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortType>(() => {
    const saved = sessionStorage.getItem(`sort_pref_${id}`);
    return (saved as SortType) || 'recent';
  });

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([]);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');

  const handleSortChange = (value: SortType) => {
    setSortBy(value);
    sessionStorage.setItem(`sort_pref_${id}`, value);
  };

  const category = useMemo(() => data.categories.find(c => c.id === id), [id, data.categories]);
  
  const worksWithStats = useMemo(() => {
    const works = data.works.filter(w => w.categoryId === id);
    return works.map(work => {
      const records = data.records.filter(r => r.workId === work.id);
      const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
      return {
        ...work,
        recordCount: records.length,
        recentDate: sortedRecords[sortedRecords.length - 1]?.date || '',
        firstDate: sortedRecords[0]?.date || '',
      };
    });
  }, [id, data.works, data.records]);

  const sortedWorks = useMemo(() => {
    const works = [...worksWithStats];
    switch (sortBy) {
      case 'recent':
        return works.sort((a, b) => b.recentDate.localeCompare(a.recentDate));
      case 'most_frequent':
        return works.sort((a, b) => b.recordCount - a.recordCount);
      case 'first_time':
        return works.sort((a, b) => a.firstDate.localeCompare(b.firstDate));
      default:
        return works;
    }
  }, [worksWithStats, sortBy]);

  const toggleSelection = (workId: string) => {
    setSelectedWorkIds(prev => 
      prev.includes(workId) ? prev.filter(id => id !== workId) : [...prev, workId]
    );
  };

  const handleBatchDelete = () => {
    if (selectedWorkIds.length === 0) return;
    if (window.confirm(`确定要删除选中的 ${selectedWorkIds.length} 个作品吗？`)) {
      batchDeleteWorks(selectedWorkIds);
      setIsSelectionMode(false);
      setSelectedWorkIds([]);
    }
  };

  const handleBatchMove = () => {
    if (selectedWorkIds.length === 0 || !targetCategoryId) return;
    batchMoveWorks(selectedWorkIds, targetCategoryId);
    setIsMoveDialogOpen(false);
    setIsSelectionMode(false);
    setSelectedWorkIds([]);
    setTargetCategoryId('');
  };

  if (!category) return null;

  return (
    <div className={cn(
      "min-h-screen bg-background animate-in slide-in-from-right duration-300 pt-[72px]",
      isSelectionMode ? "pb-40" : "pb-24"
    )}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto flex items-center justify-between p-4 border-b border-border/50 bg-background shadow-sm z-50">
        {isSelectionMode ? (
          <>
            <button onClick={() => { setIsSelectionMode(false); setSelectedWorkIds([]); }} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
              已选择 {selectedWorkIds.length} 项
            </h2>
            <div className="w-10" />
          </>
        ) : (
          <>
            <button onClick={() => navigate('/categories')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <span>{category.icon}</span> {category.name}
            </h2>
            <button 
              onClick={() => setIsSelectionMode(true)} 
              className="text-xs font-bold text-primary uppercase tracking-widest"
            >
              选择
            </button>
          </>
        )}
      </header>

      <div className="p-6 space-y-6">
        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <ArrowUpDown size={14} /> 排序方式
          </div>
          <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortType)}>
            <SelectTrigger className="w-[140px] h-9 rounded-full bg-card border-border text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">最近制作</SelectItem>
              <SelectItem value="most_frequent">做过最多</SelectItem>
              <SelectItem value="first_time">最早制作</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Works Grid */}
        {sortedWorks.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {sortedWorks.map(work => {
              const isSelected = selectedWorkIds.includes(work.id);
              return (
                <div 
                  key={work.id} 
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(work.id);
                    } else {
                      navigate(`/work/${work.id}`, { state: { backTo: `/category/${id}` } });
                    }
                  }}
                  className={cn(
                    "bg-card rounded-2xl border shadow-sm overflow-hidden transition-all group flex flex-col cursor-pointer relative",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:shadow-md"
                  )}
                >
                  {isSelectionMode && (
                    <div className="absolute top-2 right-2 z-10">
                      {isSelected ? (
                        <CheckCircle2 size={20} className="text-primary fill-primary/20" />
                      ) : (
                        <Circle size={20} className="text-white drop-shadow-md" />
                      )}
                    </div>
                  )}
                  <div className="aspect-square bg-muted/30 relative overflow-hidden">
                    {work.isEmojiCover ? (
                      <div className="w-full h-full flex items-center justify-center text-4xl">{work.coverImage}</div>
                    ) : (
                      <img src={work.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    )}
                    {isSelectionMode && <div className="absolute inset-0 bg-black/10" />}
                  </div>
                  <div className="p-2 space-y-0.5 text-center">
                    <h4 className="text-[10px] font-bold text-foreground truncate">{work.name}</h4>
                    <p className="text-[8px] text-muted-foreground font-bold">
                      {sortBy === 'recent' && (work.recentDate ? formatDate(work.recentDate) : '暂无')}
                      {sortBy === 'most_frequent' && `已做 ${work.recordCount} 次`}
                      {sortBy === 'first_time' && (work.firstDate ? formatDate(work.firstDate) : '暂无')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed border-border">
            <p className="text-xs text-muted-foreground italic">该分类暂无作品</p>
          </div>
        )}
      </div>

      {/* Selection Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto p-4 bg-background border-t border-border/50 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom flex gap-3">
          <Button 
            variant="outline"
            className="flex-1 rounded-2xl h-12 text-xs font-bold uppercase tracking-widest border-destructive/20 text-destructive hover:bg-destructive/10"
            onClick={handleBatchDelete}
            disabled={selectedWorkIds.length === 0}
          >
            <Trash2 size={16} className="mr-2" /> 删除
          </Button>
          <Button 
            className="flex-1 rounded-2xl h-12 text-xs font-bold uppercase tracking-widest"
            onClick={() => setIsMoveDialogOpen(true)}
            disabled={selectedWorkIds.length === 0}
          >
            <FolderInput size={16} className="mr-2" /> 转移分类
          </Button>
        </div>
      )}

      {/* Move Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6">
          <DialogHeader>
            <DialogTitle className="text-center serif text-xl">转移至新分类</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger className="w-full h-12 rounded-2xl bg-card border-border text-sm font-bold">
                <SelectValue placeholder="选择目标分类" />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                {data.categories.filter(c => c.id !== id).map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleBatchMove} 
              disabled={!targetCategoryId}
              className="w-full rounded-2xl h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              确认转移
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryDetailPage;
