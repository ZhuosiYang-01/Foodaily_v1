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
        previewWorks: works.slice(0, 3)
      };
    });
  }, [data]);

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 serif flex items-center gap-2">
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
            className="block bg-white rounded-3xl p-6 shadow-sm border border-gray-50 group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  共 {cat.workCount} 个作品 · 已记录 {cat.recordCount} 次
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
            </div>

            {cat.previewWorks.length > 0 ? (
              <div className="flex gap-3">
                {cat.previewWorks.map(work => (
                  <div key={work.id} className="flex-1 aspect-square rounded-2xl overflow-hidden bg-gray-50 shadow-inner relative">
                    {work.isEmojiCover ? (
                      <div className="w-full h-full flex items-center justify-center text-3xl">{work.coverImage}</div>
                    ) : (
                      <img src={work.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/20 backdrop-blur-sm">
                      <p className="text-[8px] font-bold text-white truncate text-center">{work.name}</p>
                    </div>
                  </div>
                ))}
                {cat.previewWorks.length < 3 && Array.from({ length: 3 - cat.previewWorks.length }).map((_, i) => (
                  <div key={i} className="flex-1 aspect-square rounded-2xl border-2 border-dashed border-gray-50 flex items-center justify-center text-gray-100 italic text-[10px]">
                    空
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                <p className="text-[10px] text-gray-400 italic">暂无作品</p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
