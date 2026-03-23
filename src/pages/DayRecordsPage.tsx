import React, { useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen bg-white pb-24 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> {date.replace(/-/g, '.')}
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
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-video bg-gray-50 relative overflow-hidden">
                    {record.isEmojiMain ? (
                      <div className="w-full h-full flex items-center justify-center text-6xl">{record.mainImage}</div>
                    ) : (
                      <img src={record.mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {data.categories.find(c => c.id === work?.categoryId)?.name}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 serif">{record.title}</h3>
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
          <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 italic">这一天没有记录哦</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayRecordsPage;
