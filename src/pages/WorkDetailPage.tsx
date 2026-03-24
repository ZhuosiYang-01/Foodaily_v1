import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Edit3, History, Calendar, Star, StickyNote, RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Work, RecordEntry } from '../types';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import ImageViewer from '../components/ImageViewer';

const WorkDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, deleteWork, addRecord, restoreLastDeleted } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const work = useMemo(() => data.works.find(w => w.id === id), [id, data.works]);
  const records = useMemo(() => 
    data.records.filter(r => r.workId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [id, data.records]
  );
  const category = useMemo(() => data.categories.find(c => c.id === work?.categoryId), [work, data.categories]);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const coverImages = useMemo(() => {
    if (!work || work.isEmojiCover || !work.coverImage) return [];
    return [work.coverImage];
  }, [work]);

  const handleDeleteWork = () => {
    if (!work) return;
    deleteWork(work.id);
    navigate('/categories');
  };

  if (!work) return null;

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500">
      {/* Header Image */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 z-10 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={() => navigate(`/edit-work/${work.id}`)} 
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
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
          <Badge variant="secondary" className="bg-primary text-white border-none mb-2 px-3 py-0.5 h-5 text-[10px] uppercase font-bold tracking-wider">
            {category?.name}
          </Badge>
          <h1 className="text-3xl font-bold serif leading-tight">{work.name}</h1>
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
          <div className="flex gap-5 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide snap-x">
            {records.map((record, index) => (
              <Link 
                key={record.id} 
                to={`/record/${record.id}`}
                className="flex-shrink-0 w-64 snap-start bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-video bg-background relative overflow-hidden">
                  {record.isEmojiMain ? (
                    <div className="w-full h-full flex items-center justify-center text-5xl">{record.mainImage}</div>
                  ) : (
                    <img src={record.mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/40 backdrop-blur-md text-white border-none text-[10px] px-2 py-0 h-5">
                      第 {records.length - index} 次
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary" /> 
                      {formatDate(record.date)}
                      {category?.supportsTaste && record.title && ` ${record.title}`}
                    </span>
                  </div>
                  
                  {record.evaluation && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Star size={10} /> 评价
                      </p>
                      <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">{record.evaluation}</p>
                    </div>
                  )}
                  
                  {record.notes && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <StickyNote size={10} /> 备忘
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{record.notes}</p>
                    </div>
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

        <div className="pt-6 border-t border-border/50">
          <Button 
            className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            onClick={() => navigate(`/new-record?workId=${work.id}`)}
          >
            再做一次
          </Button>
        </div>

        {/* Custom Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                <Trash2 size={40} className="mx-auto text-destructive mb-2" />
                <h3 className="text-lg font-bold text-foreground">删除作品</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">确认删除吗？</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" onClick={handleDeleteWork} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">确认删除</Button>
                <Button variant="ghost" onClick={() => setShowConfirmDelete(false)} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">返回</Button>
              </div>
            </div>
          </div>
        )}
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
