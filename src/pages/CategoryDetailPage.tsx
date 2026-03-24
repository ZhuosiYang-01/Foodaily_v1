import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ArrowUpDown, History, Star, Calendar } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';

type SortType = 'recent' | 'most_frequent' | 'first_time';

const CategoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useApp();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortType>('recent');

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

  if (!category) return null;

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <span>{category.icon}</span> {category.name}
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-6">
        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <ArrowUpDown size={14} /> 排序方式
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
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
            {sortedWorks.map(work => (
              <Link 
                key={work.id} 
                to={`/work/${work.id}`}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="aspect-square bg-muted/30 relative overflow-hidden">
                  {work.isEmojiCover ? (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{work.coverImage}</div>
                  ) : (
                    <img src={work.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div className="p-2 space-y-0.5 text-center">
                  <h4 className="text-[10px] font-bold text-foreground truncate">{work.name}</h4>
                  <p className="text-[8px] text-muted-foreground font-bold">
                    {sortBy === 'recent' && (work.recentDate ? formatDate(work.recentDate) : '暂无')}
                    {sortBy === 'most_frequent' && `已做 ${work.recordCount} 次`}
                    {sortBy === 'first_time' && (work.firstDate ? formatDate(work.firstDate) : '暂无')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed border-border">
            <p className="text-xs text-muted-foreground italic">该分类暂无作品 ✨</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;
