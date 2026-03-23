import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Camera, Smile, X, Check, Search } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const NewRecordPage = () => {
  const { data, addRecord } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialWorkId = searchParams.get('workId');
  const [step, setStep] = useState(1);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  // Step 1 State
  const [workName, setWorkName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mainImage, setMainImage] = useState('');
  const [isEmojiMain, setIsEmojiMain] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(initialWorkId);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  // Initialize from workId if provided
  useEffect(() => {
    if (initialWorkId) {
      const work = data.works.find(w => w.id === initialWorkId);
      if (work) {
        setWorkName(work.name);
        setCategoryId(work.categoryId);
        setMainImage(work.coverImage);
        setIsEmojiMain(work.isEmojiCover);
      }
    }
  }, [initialWorkId, data.works]);

  // Step 2 State
  const [taste, setTaste] = useState('');
  const [recordTitle, setRecordTitle] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [notes, setNotes] = useState('');
  const [extraImages, setExtraImages] = useState<string[]>([]);

  // Derived State
  const selectedCategory = useMemo(() => data.categories.find(c => c.id === categoryId), [categoryId, data.categories]);
  const matchingWorks = useMemo(() => {
    if (!workName.trim()) return [];
    return data.works.filter(w => 
      w.name.toLowerCase().includes(workName.toLowerCase()) && 
      (categoryId ? w.categoryId === categoryId : true)
    ).slice(0, 3);
  }, [workName, categoryId, data.works]);

  // Auto-generate record title
  useEffect(() => {
    if (taste && workName) {
      setRecordTitle(`${taste}${workName}`);
    } else if (workName) {
      setRecordTitle(workName);
    }
  }, [taste, workName]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMain) {
          setMainImage(reader.result as string);
          setIsEmojiMain(false);
        } else {
          setExtraImages(prev => [...prev, reader.result as string].slice(0, 2));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const recordId = addRecord(
      {
        workId: selectedWorkId || '',
        date,
        title: recordTitle || workName,
        taste,
        evaluation,
        notes,
        mainImage,
        isEmojiMain,
        extraImages,
      },
      {
        name: workName,
        categoryId,
        coverImage: mainImage,
        isEmoji: isEmojiMain,
      }
    );
    navigate(`/record/${recordId}`);
  };

  const isStep1Valid = workName && categoryId && date && mainImage;

  return (
    <div className="min-h-screen bg-white pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
          新增记录
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-8">
        {step === 1 ? (
          <>
            {/* Step 1: Basic Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">作品名称 *</Label>
                <Input 
                  placeholder="请输入名称" 
                  value={workName} 
                  onChange={(e) => {
                    setWorkName(e.target.value);
                    setSelectedWorkId(null);
                  }}
                  className="rounded-xl border-gray-100 focus:ring-primary"
                />
                
                {/* Matching Works */}
                {matchingWorks.length > 0 && !selectedWorkId && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">可能已有作品：</p>
                    <div className="flex flex-wrap gap-2">
                      {matchingWorks.map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setWorkName(w.name);
                            setSelectedWorkId(w.id);
                            setCategoryId(w.categoryId);
                          }}
                          className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <Check size={12} /> {w.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">分类 *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={!!selectedWorkId}>
                  <SelectTrigger className="rounded-xl border-gray-100">
                    <SelectValue placeholder="请选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">制作日期 *</Label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">封面图 *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-white"
                      onClick={() => setShowPhotoOptions(true)}
                    >
                      <Camera size={32} className="text-gray-300 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">上传照片</span>
                    </button>
                    {showPhotoOptions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => { cameraInputRef.current?.click(); setShowPhotoOptions(false); }}
                          className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          拍照上传
                        </button>
                        <button 
                          onClick={() => { galleryInputRef.current?.click(); setShowPhotoOptions(false); }}
                          className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors"
                        >
                          从相册中选择
                        </button>
                        <button 
                          onClick={() => setShowPhotoOptions(false)}
                          className="w-full text-left px-4 py-3 text-[10px] font-bold text-red-400 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors border-t border-gray-50 mt-1"
                        >
                          取消
                        </button>
                      </div>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={(e) => handleImageUpload(e, true)} />
                    <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={(e) => handleImageUpload(e, true)} />
                  </div>
                  
                  <button 
                    onClick={() => {
                      const emoji = prompt('请输入一个 Emoji');
                      if (emoji) {
                        setMainImage(emoji);
                        setIsEmojiMain(true);
                      }
                    }}
                    className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <Smile size={32} className="text-gray-300 group-hover:text-primary transition-colors mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">选择 Emoji</span>
                  </button>
                </div>
                
                {mainImage && (
                  <div className="mt-4 relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-gray-50">
                    {isEmojiMain ? (
                      <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-50">{mainImage}</div>
                    ) : (
                      <img src={mainImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                    <button 
                      onClick={() => setMainImage('')}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
                className="w-full rounded-xl h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                下一步 <ChevronRight size={18} className="ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Details */}
            <div className="space-y-6">
              {selectedCategory?.supportsTaste && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">口味（选填）</Label>
                  <Input 
                    placeholder="例如：橙子 / 巧克力" 
                    value={taste} 
                    onChange={(e) => setTaste(e.target.value)}
                    className="rounded-xl border-gray-100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">记录名称（选填）</Label>
                <Input 
                  placeholder="默认：作品名称，可自行修改" 
                  value={recordTitle} 
                  onChange={(e) => setRecordTitle(e.target.value)}
                  className="rounded-xl border-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">评价（选填）</Label>
                <Textarea 
                  placeholder="这次状态比上次更稳……" 
                  value={evaluation} 
                  onChange={(e) => setEvaluation(e.target.value)}
                  className="rounded-xl border-gray-100 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">备忘（选填）</Label>
                <Textarea 
                  placeholder="下次少放一点糖……" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl border-gray-100 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">其他照片 (最多 2 张)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {extraImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-50">
                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setExtraImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {extraImages.length < 2 && (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                      <PlusCircle size={24} className="text-gray-300 group-hover:text-primary transition-colors" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSave}
                className="w-full rounded-xl h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                保存记录
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PlusCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export default NewRecordPage;
