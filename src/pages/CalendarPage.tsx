import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CalendarPage = () => {
  const { data, getMonthlyStats } = useApp();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showPicker, setShowPicker] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let startYear = currentYear;
    let startMonth = currentMonth;

    if (data.records.length > 0) {
      const sortedDates = data.records
        .map(r => new Date(r.date))
        .sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      startYear = firstDate.getFullYear();
      startMonth = firstDate.getMonth();
    }

    const availableYears = [];
    for (let i = startYear; i <= currentYear; i++) {
      availableYears.push(i);
    }

    return {
      startYear,
      startMonth,
      currentYear,
      currentMonth,
      availableYears
    };
  }, [data.records]);

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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarIcon size={24} className="text-primary" /> 日历
        </h1>
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          {randomCopy}
        </p>
      </header>

      {/* Monthly Stats */}
      <section className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">本月统计</h2>
        <div className="flex gap-6">
          {data.categories.map(cat => (
            <div key={cat.id} className="flex flex-col">
              <span className="text-lg font-bold text-foreground">{stats[cat.name] || 0}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar Control */}
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 space-y-6 relative">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1 px-4 py-1 rounded-full hover:bg-muted transition-colors"
          >
            <h3 className="text-lg font-bold text-foreground">
              {year}年 {month + 1}月
            </h3>
            <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", showPicker && "rotate-180")} />
          </button>
          <button onClick={nextMonth} className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Year/Month Picker Overlay */}
        <AnimatePresence>
          {showPicker && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-6 right-6 bg-card border border-border shadow-xl rounded-2xl z-20 p-4 space-y-4"
            >
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">选择年份</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {dateRange.availableYears.map(y => (
                    <button
                      key={y}
                      onClick={() => setCurrentDate(new Date(y, month, 1))}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold shrink-0 snap-start transition-colors",
                        y === year ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">选择月份</p>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const isBeforeStart = year === dateRange.startYear && i < dateRange.startMonth;
                    const isAfterCurrent = year === dateRange.currentYear && i > dateRange.currentMonth;
                    const isDisabled = isBeforeStart || isAfterCurrent;

                    return (
                      <button
                        key={i}
                        disabled={isDisabled}
                        onClick={() => {
                          setCurrentDate(new Date(year, i, 1));
                          setShowPicker(false);
                        }}
                        className={cn(
                          "py-2 rounded-xl text-xs font-bold transition-colors",
                          i === month ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
                          isDisabled && "opacity-20 cursor-not-allowed grayscale"
                        )}
                      >
                        {i + 1}月
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-4">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest pb-2">
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
                      dayRecords ? "text-white drop-shadow-sm" : "text-muted-foreground"
                    )}>
                      {day}
                    </span>
                    {dayRecords && (
                      <div className="absolute inset-1 rounded-lg overflow-hidden flex flex-wrap gap-0.5 p-0.5 bg-muted/50 shadow-inner">
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
