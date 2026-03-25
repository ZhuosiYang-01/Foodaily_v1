import React, { useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const DayRecordsPage = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  const { data } = useApp();
  const navigate = useNavigate();

  const records = useMemo(() => 
    data.records.filter(r => r.date === date),
    [date, data.records]
  );

  if (!date) return null;

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> {formatDate(date)}
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-6">
        {records.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {records.map(record => {
              const work = data.works.find(w => w.id === record.workId);
              return (
                <Link
                  key={record.id}
                  to={`/record/${record.id}`}
                  state={{ backTo: `/day-records?date=${date}` }}
                  className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-video bg-muted/30 relative overflow-hidden">
                    {record.isEmojiMain ? (
                      <div className="w-full h-full flex items-center justify-center text-6xl">{record.mainImage}</div>
                    ) : (
                      <img src={record.mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {data.categories.find(c => c.id === work?.categoryId)?.name}
                      </p>
                      <h3 className="text-lg font-bold text-foreground serif">{record.title}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ChevronLeft size={20} className="rotate-180" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-card/50 rounded-3xl border border-dashed border-border/50">
            <p className="text-xs text-muted-foreground italic">这一天没有记录哦</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayRecordsPage;
