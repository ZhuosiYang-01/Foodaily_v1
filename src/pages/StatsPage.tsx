import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '../store/AppContext';

const prevDay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const diffDays = (a: string, b: string): number =>
  Math.round((new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime()) / 86400000);

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const StatsPage = () => {
  const { data } = useApp();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const stats = useMemo(() => {
    const { records, works, categories } = data;
    if (records.length === 0) return null;

    // Hero
    const firstDate = [...records].sort((a, b) => a.date.localeCompare(b.date))[0].date;
    const daysSinceFirst = Math.max(0, diffDays(today, firstDate));
    const totalRecords = records.length;
    const totalWorks = works.length;

    // Monthly
    const monthlyCount = records.filter(r => r.date.startsWith(thisMonth)).length;

    // Current streak
    const dateSet = new Set(records.map(r => r.date));
    let streak = 0;
    let check = dateSet.has(today) ? today : prevDay(today);
    while (dateSet.has(check)) { streak++; check = prevDay(check); }

    // Best dish (all-time)
    const workCounts = new Map<string, number>();
    records.forEach(r => workCounts.set(r.workId, (workCounts.get(r.workId) || 0) + 1));
    let bestWorkId = '', bestWorkCount = 0;
    workCounts.forEach((c, id) => { if (c > bestWorkCount) { bestWorkCount = c; bestWorkId = id; } });
    const bestWork = works.find(w => w.id === bestWorkId) ?? null;

    // New this month (first-ever record is this month, highest frequency this month)
    const thisMonthRecords = records.filter(r => r.date.startsWith(thisMonth));
    const prevWorkIds = new Set(records.filter(r => !r.date.startsWith(thisMonth)).map(r => r.workId));
    const newWorkIds = new Set(thisMonthRecords.map(r => r.workId).filter(id => !prevWorkIds.has(id)));
    const newWorkCounts = new Map<string, number>();
    thisMonthRecords.forEach(r => {
      if (newWorkIds.has(r.workId)) newWorkCounts.set(r.workId, (newWorkCounts.get(r.workId) || 0) + 1);
    });
    let newWorkId = '', newWorkMonthCount = 0;
    newWorkCounts.forEach((c, id) => { if (c > newWorkMonthCount) { newWorkMonthCount = c; newWorkId = id; } });
    const newWork = newWorkId ? (works.find(w => w.id === newWorkId) ?? null) : null;

    // Longest streak
    const sortedDates = [...dateSet].sort();
    let longest = sortedDates.length > 0 ? 1 : 0;
    let curRun = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      diffDays(sortedDates[i], sortedDates[i - 1]) === 1 ? curRun++ : (curRun = 1);
      if (curRun > longest) longest = curRun;
    }

    // Top 2 categories by record count
    const topCategories = categories.map(cat => {
      const catWorkIds = new Set(works.filter(w => w.categoryId === cat.id).map(w => w.id));
      const catRecords = records.filter(r => catWorkIds.has(r.workId));
      const catWorkCounts = new Map<string, number>();
      catRecords.forEach(r => catWorkCounts.set(r.workId, (catWorkCounts.get(r.workId) || 0) + 1));
      let topId = '', topCnt = 0;
      catWorkCounts.forEach((c, id) => { if (c > topCnt) { topCnt = c; topId = id; } });
      return { cat, recordCount: catRecords.length, topWork: works.find(w => w.id === topId) ?? null, topCount: topCnt };
    }).filter(c => c.recordCount > 0).sort((a, b) => b.recordCount - a.recordCount).slice(0, 2);

    // Weekly pattern (Mon=0…Sun=6)
    const weekCounts = [0, 0, 0, 0, 0, 0, 0];
    records.forEach(r => {
      const dow = new Date(r.date + 'T00:00:00').getDay();
      weekCounts[dow === 0 ? 6 : dow - 1]++;
    });
    const maxWeekCount = Math.max(...weekCounts, 1);
    const weekendAvg = (weekCounts[5] + weekCounts[6]) / 2;
    const weekdayAvg = (weekCounts[0] + weekCounts[1] + weekCounts[2] + weekCounts[3] + weekCounts[4]) / 5;
    let weekLabel: string, weekCopy: string;
    if (weekendAvg > weekdayAvg * 1.5) {
      weekLabel = '你更喜欢在周末下厨';
      weekCopy = '把周末变成了最有烟火气的时光。';
    } else if (weekdayAvg > weekendAvg * 1.5) {
      weekLabel = '工作日是你的下厨主场';
      weekCopy = '工作再忙，你也没忘记照顾自己的生活。';
    } else {
      weekLabel = '你每天都在认真生活';
      weekCopy = '每一顿都不将就。';
    }

    return {
      firstDate, daysSinceFirst, totalRecords, totalWorks,
      monthlyCount, streak, bestWork, bestWorkCount,
      newWork, newWorkMonthCount, longest,
      topCategories, weekCounts, maxWeekCount, weekLabel, weekCopy,
    };
  }, [data, today, thisMonth]);

  return (
    <div className="pb-24 pt-6 px-4 space-y-3 animate-in fade-in duration-500 min-h-screen bg-background">
      <header className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/categories')} className="p-1 -ml-1 text-muted-foreground">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">烹饪报告</h1>
      </header>

      {!stats ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">还没有任何记录，快去添加第一条吧！</p>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="bg-primary text-primary-foreground rounded-3xl p-6">
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-3">你的烹饪旅程</p>
            <div className="space-y-1 text-sm">
              <p>你从 <span className="font-bold">{formatDate(stats.firstDate)}</span> 开始记录</p>
              <p>到今天一共 <span className="font-black text-2xl">{stats.daysSinceFirst}</span> 天了</p>
              <p>这其中你一共下厨 <span className="font-black text-2xl">{stats.totalRecords}</span> 次</p>
              <p>解锁菜谱 <span className="font-black text-2xl">{stats.totalWorks}</span> 道</p>
            </div>
          </div>

          {/* Monthly + streak (left) | Best dish (right) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3">
              <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5 flex-1 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">本月</p>
                <div className="mt-2">
                  <span className="text-4xl font-black text-foreground">{stats.monthlyCount}</span>
                  <span className="text-sm font-bold text-muted-foreground ml-1">次</span>
                </div>
              </div>
              <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5 flex-1 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">连续打卡</p>
                <div className="mt-2">
                  <span className="text-4xl font-black text-foreground">{stats.streak}</span>
                  <span className="text-sm font-bold text-muted-foreground ml-1">天</span>
                </div>
              </div>
            </div>

            {stats.bestWork && (
              <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 relative" style={{ minHeight: '150px' }}>
                  {stats.bestWork.isEmojiCover ? (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl bg-muted">
                      {stats.bestWork.coverImage}
                    </div>
                  ) : (
                    <img
                      src={stats.bestWork.coverImage}
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">最拿手的菜</p>
                  <p className="text-sm font-bold text-foreground mt-1 truncate">「{stats.bestWork.name}」</p>
                  <p className="text-xs text-muted-foreground">已经做了 {stats.bestWorkCount} 次</p>
                </div>
              </div>
            )}
          </div>

          {/* New this month */}
          {stats.newWork && (
            <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">本月新学</p>
              <p className="text-sm text-foreground leading-relaxed">
                这个月你第一次尝试了<span className="font-bold">「{stats.newWork.name}」</span>，已经做了 <span className="font-bold">{stats.newWorkMonthCount}</span> 次！
              </p>
            </div>
          )}

          {/* Longest streak */}
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">历史最长连续打卡</p>
            <p className="text-sm text-foreground">
              你曾经坚持了{' '}
              <span className="text-3xl font-black text-foreground">{stats.longest}</span>
              {' '}天不间断
            </p>
          </div>

          {/* Top categories */}
          {stats.topCategories.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {stats.topCategories.map(({ cat, topWork, topCount }) => (
                <div key={cat.id} className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
                  {topWork && (
                    <div className="aspect-square relative">
                      {topWork.isEmojiCover ? (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl bg-muted">
                          {topWork.coverImage}
                        </div>
                      ) : (
                        <img
                          src={topWork.coverImage}
                          className="absolute inset-0 w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">最爱{cat.name}</p>
                    {topWork && (
                      <>
                        <p className="text-xs font-bold text-foreground mt-1 truncate">{topWork.name}</p>
                        <p className="text-[10px] text-muted-foreground">已做 {topCount} 次</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weekly pattern */}
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">周活跃规律</p>
            <p className="text-sm font-bold text-foreground">{stats.weekLabel}</p>
            <p className="text-xs text-muted-foreground mb-4">{stats.weekCopy}</p>
            <div className="flex items-end gap-1.5 h-16">
              {stats.weekCounts.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: count > 0
                        ? `${Math.max(Math.round((count / stats.maxWeekCount) * 52), 4)}px`
                        : '2px',
                      backgroundColor: count > 0
                        ? `hsl(var(--primary) / ${0.4 + 0.6 * (count / stats.maxWeekCount)})`
                        : 'hsl(var(--muted))',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1">
              {WEEK_LABELS.map((label, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPage;
