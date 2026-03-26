import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit3, Trash2, Calendar, Star, StickyNote, Image as ImageIcon, ArrowRight, RotateCcw } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import ImageViewer from '../components/ImageViewer';

const RecordDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, deleteRecord, restoreLastDeleted } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const fromWorkId = (location.state as any)?.fromWorkId as string | undefined;
  const recordIds = (location.state as any)?.recordIds as string[] | undefined;
  const backTo = (location.state as any)?.backTo as string | undefined;
  const currentIndex = recordIds ? recordIds.indexOf(id!) : -1;
  const prevId = currentIndex > 0 ? recordIds![currentIndex - 1] : null;
  const nextId = currentIndex !== -1 && currentIndex < (recordIds?.length ?? 0) - 1 ? recordIds![currentIndex + 1] : null;

  const record = useMemo(() => data.records.find(r => r.id === id), [id, data.records]);
  const work = useMemo(() => data.works.find(w => w.id === record?.workId), [record, data.works]);
  const category = useMemo(() => data.categories.find(c => c.id === work?.categoryId), [work, data.categories]);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const allImages = useMemo(() => {
    if (!record) return [];
    const images = [];
    if (!record.isEmojiMain && record.mainImage) {
      images.push(record.originalMainImage || record.mainImage);
    }
    if (record.extraImages && record.extraImages.length > 0) {
      images.push(...record.extraImages);
    }
    return images;
  }, [record]);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  if (!record) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center text-muted-foreground/30">
        <RotateCcw size={32} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground">记录不存在</p>
        <p className="text-xs text-muted-foreground">该记录可能已被删除或尚未同步</p>
      </div>
      <Button variant="ghost" onClick={() => navigate('/')} className="text-xs font-bold uppercase tracking-widest text-primary">返回首页</Button>
    </div>
  );

  const handleDelete = () => {
    deleteRecord(record.id);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Image */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        <button
          onClick={() => {
            if (fromWorkId) {
              navigate(`/work/${fromWorkId}`, { state: { backTo } });
            } else if (backTo) {
              navigate(backTo);
            } else {
              navigate(-1);
            }
          }}
          className="absolute top-4 left-4 z-10 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        {record.isEmojiMain ? (
          <div className="w-full h-full flex items-center justify-center text-9xl bg-gray-50">
            {record.mainImage}
          </div>
        ) : (
          <img 
            src={record.mainImage} 
            alt={record.title} 
            className="w-full h-full object-cover cursor-pointer"
            referrerPolicy="no-referrer"
            onClick={() => openViewer(0)}
          />
        )}
        
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => navigate(`/edit-record/${record.id}`, { state: location.state })}
            className="p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
          >
            <Edit3 size={20} />
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Prev / Next record navigation (only when entering from WorkDetailPage) */}
        {fromWorkId && (
          <>
            {prevId ? (
              <button
                onClick={() => navigate(`/record/${prevId}`, { state: { fromWorkId, recordIds, backTo } })}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/50 transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
            ) : null}
            {nextId ? (
              <button
                onClick={() => navigate(`/record/${nextId}`, { state: { fromWorkId, recordIds, backTo } })}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/50 transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            ) : null}
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
          <Badge variant="secondary" className="bg-primary text-white border-none mb-2 px-3 py-0.5 h-5 text-[10px] uppercase font-bold tracking-wider">
            {category?.name}
          </Badge>
          <h1 className="text-3xl font-bold leading-tight">{record.title}</h1>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm opacity-80 font-medium flex items-center gap-1.5">
              <Calendar size={14} /> {formatDate(record.date)}
            </p>
            {fromWorkId && currentIndex !== -1 && (
              <span className="text-[10px] text-white/60 font-bold">
                {currentIndex + 1} / {recordIds!.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-8">
        {/* Evaluation & Notes */}
        <div className="grid grid-cols-1 gap-8">
          {record.evaluation && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Star size={14} className="text-primary" /> 评价
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed bg-card p-4 rounded-2xl border border-border/50">
                {record.evaluation}
              </p>
            </div>
          )}

          {record.notes && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <StickyNote size={14} className="text-primary" /> 备忘
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed bg-card p-4 rounded-2xl border border-border/50">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Extra Images */}
        {record.extraImages && record.extraImages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} className="text-primary" /> 更多照片
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {record.extraImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className="aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-50 cursor-pointer"
                  onClick={() => openViewer(record.isEmojiMain ? idx : idx + 1)}
                >
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-8 border-t border-border/50 space-y-4">
          <Button 
            className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={() => navigate(`/new-record?workId=${work?.id}`)}
          >
            再做一次
          </Button>

          <Link
            to={`/work/${work?.id}`}
            state={fromWorkId ? { backTo } : { fromRecordId: record.id, chainBackTo: backTo }}
            className="flex items-center justify-between w-full p-4 bg-card rounded-2xl group hover:bg-accent transition-colors border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl shadow-sm">
                {work?.isEmojiCover ? work.coverImage : (work?.coverImage ? <img src={work.coverImage} className="w-full h-full object-cover rounded-xl" /> : '🍽️')}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">查看该作品全部记录</p>
                <p className="text-sm font-bold text-foreground">{work?.name}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>

        {/* Custom Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                <Trash2 size={40} className="mx-auto text-destructive mb-2" />
                <h3 className="text-lg font-bold text-foreground">删除记录</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">确认删除吗？</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" onClick={handleDelete} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">确认删除</Button>
                <Button variant="ghost" onClick={() => setShowConfirmDelete(false)} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">返回</Button>
              </div>
            </div>
          </div>
        )}
        {/* ImageViewer */}
        <ImageViewer 
          images={allImages} 
          initialIndex={viewerIndex} 
          isOpen={viewerOpen} 
          onClose={() => setViewerOpen(false)} 
        />
      </div>
    </div>
  );
};

export default RecordDetailPage;
