import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, LayoutGrid, Edit3 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';

const CategoriesPage = () => {
  const { data } = useApp();
  const navigate = useNavigate();

  const categoryStats = useMemo(() => {
    return data.categories.map(cat => {
      const works = data.works.filter(w => w.categoryId === cat.id);
      const records = data.records.filter(r => {
        const work = data.works.find(w => w.id === r.workId);
        return work?.categoryId === cat.id;
      });
      return {
        ...cat,
        workCount: works.length,
        recordCount: records.length,
        previewWorks: [...works].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4)
      };
    });
  }, [data]);

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <LayoutGrid size={24} className="text-primary" /> 分类
        </h1>
        <button 
          onClick={() => navigate('/settings/categories')}
          className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
        >
          <Edit3 size={14} /> 编辑分类
        </button>
      </header>

      {/* Category List */}
      <div className="space-y-6">
        {categoryStats.map(cat => (
          <Link 
            key={cat.id} 
            to={`/category/${cat.id}`}
            className="block bg-card rounded-3xl p-6 shadow-sm border border-border/50 group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  共 {cat.workCount} 个作品 · 已记录 {cat.recordCount} 次
                </p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {cat.previewWorks.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {cat.previewWorks.map(work => (
                  <div key={work.id} className="aspect-square rounded-2xl overflow-hidden bg-background shadow-inner relative">
                    {work.isEmojiCover ? (
                      <div className="w-full h-full flex items-center justify-center text-3xl">{work.coverImage}</div>
                    ) : (
                      <img src={work.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-background rounded-2xl border border-dashed border-border/50">
                <p className="text-[10px] text-muted-foreground">暂无作品</p>
              </div>
            )}
          </Link>
        ))}
      </div>

      <p className="text-center text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest pb-4">
        共 {data.works.length} 个作品 · 累计记录 {data.records.length} 次
      </p>
    </div>
  );
};

export default CategoriesPage;
