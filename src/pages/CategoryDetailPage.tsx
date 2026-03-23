import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ArrowUpDown, History, Star, Calendar } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-white pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <span>{category.icon}</span> {category.name}
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-6">
        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <ArrowUpDown size={14} /> 排序方式
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
            <SelectTrigger className="w-[140px] h-9 rounded-full bg-gray-50 border-none text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">最近制作</SelectItem>
              <SelectItem value="most_frequent">做过最多</SelectItem>
              <SelectItem value="first_time">首次制作</SelectItem>
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {work.isEmojiCover ? (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{work.coverImage}</div>
                  ) : (
                    <img src={work.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div className="p-2 space-y-0.5 text-center">
                  <h4 className="text-[10px] font-bold text-gray-900 truncate">{work.name}</h4>
                  <p className="text-[8px] text-gray-400 font-bold">{work.recordCount} 次</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 italic">该分类暂无作品 ✨</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetailPage;
