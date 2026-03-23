import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Edit3, Trash2, Calendar, Star, StickyNote, Image as ImageIcon, ArrowRight, RotateCcw } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const RecordDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, deleteRecord } = useApp();
  const navigate = useNavigate();

  const record = useMemo(() => data.records.find(r => r.id === id), [id, data.records]);
  const work = useMemo(() => data.works.find(w => w.id === record?.workId), [record, data.works]);
  const category = useMemo(() => data.categories.find(c => c.id === work?.categoryId), [work, data.categories]);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  if (!record) return <div className="p-8 text-center text-gray-400">记录不存在</div>;

  const handleDelete = () => {
    setShowConfirmDelete(false);
    setIsPendingDelete(true);
    
    deleteTimeoutRef.current = setTimeout(() => {
      deleteRecord(record.id);
      navigate(-1);
    }, 5000);
  };

  const cancelDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    setIsPendingDelete(false);
  };

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
        
        {record.isEmojiMain ? (
          <div className="w-full h-full flex items-center justify-center text-9xl bg-gray-50">
            {record.mainImage}
          </div>
        ) : (
          <img 
            src={record.mainImage} 
            alt={record.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={() => navigate(`/edit-record/${record.id}`)} 
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

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
          <Badge variant="secondary" className="bg-primary text-white border-none mb-2 px-3 py-0.5 h-5 text-[10px] uppercase font-bold tracking-wider">
            {category?.name}
          </Badge>
          <h1 className="text-3xl font-bold serif leading-tight">{record.title}</h1>
          <p className="text-sm opacity-80 mt-1 font-medium flex items-center gap-1.5">
            <Calendar size={14} /> {record.date.replace(/-/g, '.')}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-8">
        {/* Evaluation & Notes */}
        <div className="grid grid-cols-1 gap-8">
          {record.evaluation && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Star size={14} className="text-primary" /> 评价
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50 italic">
                {record.evaluation}
              </p>
            </div>
          )}

          {record.notes && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <StickyNote size={14} className="text-primary" /> 备忘
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
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
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-50">
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-8 border-t border-gray-50">
          <Link 
            to={`/work/${work?.id}`}
            className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-2xl group hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                {work?.isEmojiCover ? work.coverImage : (work?.coverImage ? <img src={work.coverImage} className="w-full h-full object-cover rounded-xl" /> : '🍽️')}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">查看该作品全部记录</p>
                <p className="text-sm font-bold text-gray-900">{work?.name}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </Link>
        </div>

        {/* Custom Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                <Trash2 size={40} className="mx-auto text-red-500 mb-2" />
                <h3 className="text-lg font-bold text-gray-900">删除记录</h3>
                <p className="text-xs text-gray-400 leading-relaxed">确认删除吗？</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="destructive" onClick={handleDelete} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">确认删除</Button>
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
              <p className="text-xs font-bold">记录已删除</p>
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

export default RecordDetailPage;
