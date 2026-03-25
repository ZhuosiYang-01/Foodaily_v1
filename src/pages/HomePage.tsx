import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const HomePage = () => {
  const { data, getMonthlyStats } = useApp();
  const navigate = useNavigate();

  const now = new Date();
  const stats = useMemo(() => getMonthlyStats(now.getFullYear(), now.getMonth() + 1), [data.records]);

  const sortedCategories = useMemo(() => {
    return [...data.categories].sort((a, b) => a.order - b.order);
  }, [data.categories]);

  const categoryRecords = useMemo(() => {
    return sortedCategories.map(cat => {
      const records = data.records
        .filter(r => {
          const work = data.works.find(w => w.id === r.workId);
          return work?.categoryId === cat.id;
        })
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4);
      return { ...cat, records };
    });
  }, [sortedCategories, data.works, data.records]);

  const recordingDays = useMemo(() => {
    if (data.records.length === 0) return 0;
    const dates = data.records.map(r => new Date(r.date).getTime());
    const earliestDate = Math.min(...dates);
    const diffTime = Math.abs(now.getTime() - earliestDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [data.records]);

  const playfulSuffixes = [
    "继续加油呀！",
    "今天想做什么好吃的？",
    "每一道菜都是对生活的热爱。",
    "你的橱窗里又多了一件艺术品吗？",
    "记得把美味瞬间记下来哦。",
  ];

  const randomSuffix = useMemo(() => playfulSuffixes[Math.floor(Math.random() * playfulSuffixes.length)], []);

  return (
    <div className="pb-24 pt-6 px-4 space-y-6 animate-in fade-in duration-500">
      {/* Top Section: Header, Stats, Search */}
      <div className="space-y-4">
        {/* Header & Copy */}
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground serif">Foodaily</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            今天是你记录下厨的第 {recordingDays} 天，{randomSuffix}
          </p>
        </header>

        {/* Monthly Stats */}
        <section className="bg-card rounded-xl p-3 px-4 shadow-sm border border-border/50 flex items-center flex-wrap gap-y-1">
          <span className="text-xs font-semibold text-muted-foreground mr-1">本月已做：</span>
          <div className="flex items-center flex-wrap gap-x-2 text-xs font-medium text-foreground">
            {sortedCategories.map((cat, index) => (
              <span key={cat.id} className="flex items-center">
                <span className="text-primary font-bold mr-0.5">{stats[cat.name] || 0}</span>
                <span>{cat.name}</span>
                {index < sortedCategories.length - 1 && <span className="text-muted-foreground/30">，</span>}
              </span>
            ))}
          </div>
        </section>

        {/* Search Bar */}
        <div 
          onClick={() => navigate('/search')}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="w-full bg-card border border-border/50 rounded-full py-3 pl-12 pr-4 text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/30">
            搜索作品或记录...
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-8">
        {categoryRecords.map(cat => (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </h3>
              <Link to={`/category/${cat.id}`} className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
                查看更多 <ChevronRight size={14} />
              </Link>
            </div>

            {cat.records.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x">
                {cat.records.map(record => {
                  const work = data.works.find(w => w.id === record.workId);
                  return (
                    <Link 
                      key={record.id} 
                      to={`/record/${record.id}`}
                      className="flex-shrink-0 w-[30%] snap-start group bg-card rounded-2xl p-1.5 border border-border/50 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 relative group-hover:shadow-sm transition-shadow">
                        {record.isEmojiMain ? (
                          <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50">
                            {record.mainImage}
                          </div>
                        ) : (
                          <img 
                            src={record.mainImage} 
                            alt={work?.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="text-center px-0.5 pb-1">
                        <h4 className="text-[10px] font-bold text-foreground truncate">{work?.name}</h4>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{formatDate(record.date)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-8 text-center border border-dashed border-border/50">
                <p className="text-xs text-muted-foreground">暂无记录，快去开启你的第一道美味吧 ✨</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
