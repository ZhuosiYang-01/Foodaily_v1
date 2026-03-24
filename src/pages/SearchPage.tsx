import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Search as SearchIcon, X, ArrowRight, History } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const { search, data } = useApp();
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return { works: [], records: [] };
    return search(query);
  }, [query, search]);

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 relative">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            autoFocus
            placeholder="搜索作品或记录..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full pl-12 pr-10 border-border bg-card focus:ring-primary h-11"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <div className="p-6 space-y-10">
        {query.trim() ? (
          <>
            {/* Works Results */}
            {results.works.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">相关作品</h3>
                <div className="grid grid-cols-1 gap-3">
                  {results.works.map(work => (
                    <Link 
                      key={work.id} 
                      to={`/work/${work.id}`}
                      className="flex items-center gap-4 p-3 bg-card rounded-2xl group hover:bg-muted/30 transition-colors border border-border/50"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-background shadow-sm flex-shrink-0">
                        {work.isEmojiCover ? (
                          <div className="w-full h-full flex items-center justify-center text-3xl">{work.coverImage}</div>
                        ) : (
                          <img src={work.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {data.categories.find(c => c.id === work.categoryId)?.name}
                        </p>
                        <h4 className="text-sm font-bold text-foreground truncate">{work.name}</h4>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Records Results */}
            {results.records.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">相关记录</h3>
                <div className="grid grid-cols-1 gap-3">
                  {results.records.map(record => {
                    const work = data.works.find(w => w.id === record.workId);
                    return (
                      <Link 
                        key={record.id} 
                        to={`/record/${record.id}`}
                        className="flex items-center gap-4 p-3 bg-card rounded-2xl group hover:bg-muted/30 transition-colors border border-border/50"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-background shadow-sm flex-shrink-0">
                          {record.isEmojiMain ? (
                            <div className="w-full h-full flex items-center justify-center text-3xl">{record.mainImage}</div>
                          ) : (
                            <img src={record.mainImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <History size={10} /> {formatDate(record.date)}
                          </p>
                          <h4 className="text-sm font-bold text-foreground truncate">{record.title}</h4>
                          <p className="text-[10px] text-muted-foreground truncate italic">{work?.name}</p>
                        </div>
                        <ArrowRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {results.works.length === 0 && results.records.length === 0 && (
              <div className="text-center py-24">
                <p className="text-sm text-muted-foreground italic">未找到相关内容 ✨</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 space-y-4">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
              <SearchIcon size={32} />
            </div>
            <p className="text-sm text-muted-foreground italic">输入作品名称、评价或备忘来搜索吧</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
