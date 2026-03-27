import React, { useMemo, useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft, Edit3, History } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import ImageViewer from '../components/ImageViewer';

const WorkDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const backTo = (location.state as any)?.backTo as string | undefined;
  const fromRecordId = (location.state as any)?.fromRecordId as string | undefined;
  const chainBackTo = (location.state as any)?.chainBackTo as string | undefined;
  const effectiveBackTo = backTo || chainBackTo;

  const work = useMemo(() => data.works.find(w => w.id === id), [id, data.works]);
  const records = useMemo(() => 
    data.records.filter(r => r.workId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [id, data.records]
  );
  const category = useMemo(() => data.categories.find(c => c.id === work?.categoryId), [work, data.categories]);

  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (work) posthog.capture('work_detail_viewed', { recordCount: records.length });
  }, [id]);

  const coverImages = useMemo(() => {
    if (!work || work.isEmojiCover || !work.coverImage) return [];
    return [work.originalCoverImage || work.coverImage];
  }, [work]);

  if (!work) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar: back + title + edit */}
      <div className="flex items-center p-4">
        <button
          onClick={() => {
            if (backTo) navigate(backTo);
            else if (fromRecordId) navigate(`/record/${fromRecordId}`, { state: { backTo: chainBackTo } });
            else navigate(-1);
          }}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-sm font-bold text-foreground truncate flex-1 text-center">
          {work.name}
        </span>
        <button
          onClick={() => navigate(`/edit-work/${work.id}`)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Edit3 size={20} />
        </button>
      </div>

      {/* Cover Image */}
      <div className="px-6">
        <div className="aspect-square w-full rounded-3xl overflow-hidden bg-gray-100 relative">
          {work.isEmojiCover ? (
            <div className="w-full h-full flex items-center justify-center text-9xl bg-gray-50">
              {work.coverImage}
            </div>
          ) : (
            <img
              src={work.coverImage}
              alt={work.name}
              className="w-full h-full object-cover cursor-pointer"
              referrerPolicy="no-referrer"
              onClick={() => setViewerOpen(true)}
            />
          )}
          {category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-black/40 backdrop-blur-md text-white border-none text-[10px] px-2 py-0.5 font-bold">
                {category.name}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <History size={16} /> 已做 {records.length} 次
          </h2>
        </div>

        {records.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
            {records.map((record, index) => (
              <Link
                key={record.id}
                to={`/record/${record.id}`}
                state={{ fromWorkId: work.id, recordIds: records.map(r => r.id), backTo: effectiveBackTo }}
                className="flex-shrink-0 w-[30%] snap-start group bg-card rounded-2xl p-1.5 border border-border/50 overflow-hidden"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                  {record.isEmojiMain ? (
                    <div className="w-full h-full flex items-center justify-center text-3xl">{record.mainImage}</div>
                  ) : (
                    <img src={record.mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="bg-black/40 backdrop-blur-md text-white border-none text-[8px] px-1.5 py-0 h-4">
                      #{records.length - index}
                    </Badge>
                  </div>
                </div>
                <div className="text-center px-0.5 py-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                    {formatDate(record.date)}
                  </p>
                  {record.evaluation && (
                    <p className="text-[9px] text-foreground/70 line-clamp-1 mt-0.5">{record.evaluation}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border/50">
            <p className="text-xs text-muted-foreground">还没有制作记录哦</p>
          </div>
        )}

        <div className="pt-4 border-t border-border/50">
          <Button 
            className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={() => navigate(`/new-record?workId=${work.id}`)}
          >
            再做一次
          </Button>
        </div>

        {/* ImageViewer */}
        <ImageViewer 
          images={coverImages} 
          isOpen={viewerOpen} 
          onClose={() => setViewerOpen(false)} 
        />
      </div>
    </div>
  );
};

export default WorkDetailPage;
