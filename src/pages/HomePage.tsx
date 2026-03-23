import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        .slice(0, 4);
      return { ...cat, records };
    });
  }, [sortedCategories, data.works, data.records]);

  const playfulCopy = [
    "最近是不是又做了新的好吃的，还没记下来？",
    "今天下厨了吗？快来记录你的美食瞬间吧！",
    "每一道菜都是对生活的热爱，记下来吧。",
    "你的橱窗里又多了一件艺术品吗？",
  ];

  const randomCopy = useMemo(() => playfulCopy[Math.floor(Math.random() * playfulCopy.length)], []);

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header & Copy */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 serif">Foodaily</h1>
        <p className="text-sm text-gray-500 italic leading-relaxed">
          {randomCopy}
        </p>
      </header>

      {/* Monthly Stats */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">本月统计</h2>
        <div className="flex gap-6">
          {sortedCategories.map(cat => (
            <div key={cat.id} className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">{String(stats[cat.name] || 0).padStart(2, '0')}</span>
              <span className="text-[10px] text-gray-400 font-medium">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <div 
        onClick={() => navigate('/search')}
        className="relative group cursor-pointer"
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
        </div>
        <div className="w-full bg-white border border-gray-100 rounded-full py-3 pl-12 pr-4 text-sm text-gray-400 shadow-sm transition-all hover:border-primary/30">
          搜索作品或记录...
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-10">
        {categoryRecords.map(cat => (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
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
                      className="flex-shrink-0 w-[30%] snap-start group bg-white rounded-2xl p-1.5 border border-gray-50 shadow-sm hover:shadow-md transition-all"
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
                        <h4 className="text-[10px] font-bold text-gray-900 truncate">{work?.name}</h4>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{record.date.split('-').slice(1).join('.')}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50/50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 italic">暂无记录，快去开启你的第一道美味吧 ✨</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
