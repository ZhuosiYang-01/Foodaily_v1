import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Edit3, History, Calendar, Star, StickyNote, RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Work, RecordEntry } from '../types';

const WorkDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, deleteWork, addRecord } = useApp();
  const navigate = useNavigate();

  const [showUndo, setShowUndo] = useState(false);
  const [lastDeletedWork, setLastDeletedWork] = useState<Work | null>(null);
  const [lastDeletedRecords, setLastDeletedRecords] = useState<RecordEntry[]>([]);

  const work = useMemo(() => data.works.find(w => w.id === id), [id, data.works]);
  const records = useMemo(() => 
    data.records.filter(r => r.workId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [id, data.records]
  );
  const category = useMemo(() => data.categories.find(c => c.id === work?.categoryId), [work, data.categories]);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const deleteTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  const handleDeleteWork = () => {
    if (!work) return;
    setShowConfirmDelete(false);
    setIsPendingDelete(true);
    
    deleteTimeoutRef.current = setTimeout(() => {
      deleteWork(work.id);
      navigate('/categories');
    }, 5000);
  };

  const cancelDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    setIsPendingDelete(false);
  };

  if (!work && !isPendingDelete) return <div className="p-8 text-center text-gray-400">作品不存在</div>;
  
  // Removed the old full-screen undo UI logic
  
  if (!work && isPendingDelete) return null; // Will be handled by the toast if we stay on page, but usually we stay until timeout
  if (!work) return null;

  return (
    <div className="min-h-screen bg-white pb-24 animate-in fade-in duration-500">
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
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
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
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <History size={16} /> 已做 {records.length} 次
          </h2>
        </div>

        {records.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide snap-x">
            {records.map((record, index) => (
              <Link 
                key={record.id} 
                to={`/record/${record.id}`}
                className="flex-shrink-0 w-64 snap-start bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="aspect-video bg-gray-50 relative overflow-hidden">
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
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar size={12} className="text-primary" /> 
                      {record.date.replace(/-/g, '.')}
                      {category?.supportsTaste && record.title && ` ${record.title}`}
                    </span>
                  </div>
                  
                  {record.evaluation && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Star size={10} /> 评价
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{record.evaluation}</p>
                    </div>
                  )}
                  
                  {record.notes && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <StickyNote size={10} /> 备忘
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 italic leading-relaxed">{record.notes}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 italic">还没有制作记录哦</p>
          </div>
        )}

        <div className="pt-6 border-t border-gray-50">
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
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                <Trash2 size={40} className="mx-auto text-red-500 mb-2" />
                <h3 className="text-lg font-bold text-gray-900">删除作品</h3>
                <p className="text-xs text-gray-400 leading-relaxed">确认删除吗？</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" onClick={handleDeleteWork} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">确认删除</Button>
                <Button variant="ghost" onClick={() => setShowConfirmDelete(false)} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-gray-400">取消</Button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Toast */}
        {isPendingDelete && (
          <div className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-300 z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-bold">作品已删除</p>
            </div>
            <Button 
              onClick={cancelDelete}
              variant="ghost" 
              className="h-8 px-4 text-primary hover:text-primary/80 text-xs font-bold uppercase tracking-widest"
            >
              <RotateCcw size={14} className="mr-1.5" /> 撤销
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkDetailPage;
