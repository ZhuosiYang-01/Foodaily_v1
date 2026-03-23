import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { cn } from '@/lib/utils';

const CalendarPage = () => {
  const { data, getMonthlyStats } = useApp();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const stats = useMemo(() => getMonthlyStats(year, month + 1), [year, month, data.records]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const recordsByDay = useMemo(() => {
    const map: { [day: number]: any[] } = {};
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    data.records.forEach(r => {
      if (r.date.startsWith(monthStr)) {
        const day = parseInt(r.date.split('-')[2]);
        if (!map[day]) map[day] = [];
        map[day].push(r);
      }
    });
    return map;
  }, [year, month, data.records]);

  const playfulCopy = [
    "最近是不是又做了新的好吃的，还没记下来？",
    "每一天都值得被记录，尤其是美味的瞬间。",
    "看看这个月你又解锁了多少新成就？",
    "时间流逝，唯有美味与爱不可辜负。",
  ];

  const randomCopy = useMemo(() => playfulCopy[Math.floor(Math.random() * playfulCopy.length)], [month]);

  const calendarDays = useMemo(() => {
    const days = [];
    // Padding for first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [year, month]);

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header & Copy */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 serif flex items-center gap-2">
          <CalendarIcon size={24} className="text-primary" /> 日历
        </h1>
        <p className="text-sm text-gray-500 italic leading-relaxed">
          {randomCopy}
        </p>
      </header>

      {/* Monthly Stats */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">本月统计</h2>
        <div className="flex gap-6">
          {data.categories.map(cat => (
            <div key={cat.id} className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">{String(stats[cat.name] || 0).padStart(2, '0')}</span>
              <span className="text-[10px] text-gray-400 font-medium">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar Control */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-primary transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-bold text-gray-900 serif">
            {year === new Date().getFullYear() ? `${month + 1}月` : `${year}.${month + 1}月`}
          </h3>
          <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-primary transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-4">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest pb-2">
              {d}
            </div>
          ))}
          {calendarDays.map((day, idx) => {
            const dayRecords = day ? recordsByDay[day] : null;
            return (
              <div 
                key={idx} 
                className={cn(
                  "aspect-square flex flex-col items-center justify-center relative",
                  day ? "cursor-pointer" : ""
                )}
                onClick={() => day && dayRecords && navigate(`/day-records?date=${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              >
                {day && (
                  <>
                    <span className={cn(
                      "text-xs font-medium z-10",
                      dayRecords ? "text-white drop-shadow-sm" : "text-gray-400"
                    )}>
                      {day}
                    </span>
                    {dayRecords && (
                      <div className="absolute inset-1 rounded-lg overflow-hidden flex flex-wrap gap-0.5 p-0.5 bg-gray-50 shadow-inner">
                        {dayRecords.slice(0, 4).map((r, i) => (
                          <div key={i} className="flex-1 min-w-[40%] h-full flex items-center justify-center overflow-hidden rounded-sm">
                            {r.isEmojiMain ? (
                              <span className="text-[10px]">{r.mainImage}</span>
                            ) : (
                              <img src={r.mainImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
