import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Camera, Smile, X, Check, Search, Scissors } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EmojiPicker from '../components/EmojiPicker';
import ImageCropperModal from '../components/ImageCropperModal';
import MilestoneBadgeModal from '../components/MilestoneBadgeModal';
import WorksMilestoneScreen from '../components/WorksMilestoneScreen';
import { compressImage, extractPhotoDate } from '../lib/imageUtils';

const NewRecordPage = () => {
  const { data, addRecord } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialWorkId = searchParams.get('workId');
  const [step, setStep] = useState(1);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 1 State
  const [workName, setWorkName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mainImage, setMainImage] = useState('');
  const [originalMainImage, setOriginalMainImage] = useState<string | undefined>();
  const [isEmojiMain, setIsEmojiMain] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(initialWorkId);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<{ type: 'main' | 'extra', index?: number, src: string } | null>(null);

  // Initialize from workId if provided
  useEffect(() => {
    if (initialWorkId) {
      const work = data.works.find(w => w.id === initialWorkId);
      if (work) {
        setWorkName(work.name);
        setCategoryId(work.categoryId);
        // Do not pre-fill mainImage and isEmojiMain to allow user to upload new photos
      }
    }
  }, [initialWorkId, data.works]);

  // Step 2 State
  const [taste, setTaste] = useState('');
  const [recordTitle, setRecordTitle] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [notes, setNotes] = useState('');
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [dishMilestone, setDishMilestone] = useState<{ count: 5 | 10 | 20; workName: string } | null>(null);
  const [worksMilestone, setWorksMilestone] = useState<{ total: number } | null>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Extract date if it's the main image
        if (isMain) {
          const photoDate = await extractPhotoDate(file);
          if (photoDate) {
            setDate(photoDate);
          }
        }

        const compressedDataUrl = await compressImage(file, 1080, 0.95);
        
        if (isMain) {
          setMainImage(compressedDataUrl);
          setOriginalMainImage(compressedDataUrl);
          setIsEmojiMain(false);
          setCropTarget({ type: 'main', src: compressedDataUrl });
        } else {
          setExtraImages(prev => [...prev, compressedDataUrl].slice(0, 2));
        }
      } catch (error) {
        console.error('Image processing failed:', error);
      }
    }
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const computeMilestones = () => {
    const name = workName || '未命名作品';

    // Dish milestone: find the work (existing or name-matched)
    let workId = selectedWorkId;
    if (!workId) {
      const existing = data.works.find(w => w.name === name && w.categoryId === categoryId);
      workId = existing?.id ?? null;
    }
    let dish: { count: 5 | 10 | 20; workName: string } | null = null;
    if (workId) {
      const nextCount = data.records.filter(r => r.workId === workId).length + 1;
      if (nextCount === 5 || nextCount === 10 || nextCount === 20) {
        dish = { count: nextCount as 5 | 10 | 20, workName: name };
      }
    }

    // Works milestone: only if this creates a brand-new work
    const isNewWork = !selectedWorkId && !data.works.find(w => w.name === name && w.categoryId === categoryId);
    let works: { total: number } | null = null;
    if (isNewWork) {
      const newTotal = data.works.length + 1;
      if (newTotal % 50 === 0) {
        works = { total: newTotal };
      }
    }

    return { dish, works };
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      console.log('Attempting to save record...');
      const { dish, works } = computeMilestones();

      const recordId = addRecord(
        {
          workId: selectedWorkId || '',
          date,
          title: recordTitle || workName || '未命名记录',
          taste,
          evaluation,
          notes,
          mainImage,
          originalMainImage,
          isEmojiMain,
          extraImages,
        },
        {
          name: workName || '未命名作品',
          categoryId,
          coverImage: mainImage,
          originalCoverImage: originalMainImage,
          isEmoji: isEmojiMain,
        }
      );

      if (!recordId) {
        throw new Error('Failed to generate record ID');
      }

      const dest = `/record/${recordId}`;

      if (dish || works) {
        setPendingNav(dest);
        if (dish) setDishMilestone(dish);
        else if (works) setWorksMilestone(works);
      } else {
        setTimeout(() => navigate(dest, { replace: true }), 100);
      }
    } catch (error) {
      console.error('Save failed:', error);
      setIsSaving(false);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`保存失败: ${errorMessage}\n请检查存储空间是否充足。`);
    }
  };

  const handleDishMilestoneContinue = () => {
    setDishMilestone(null);
    // If there's also a works milestone pending, show it next
    if (worksMilestone) return;
    if (pendingNav) navigate(pendingNav, { replace: true });
  };

  const handleWorksMilestoneContinue = () => {
    setWorksMilestone(null);
    if (pendingNav) navigate(pendingNav, { replace: true });
  };

  const isStep1Valid = workName && categoryId && date && mainImage;

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background shadow-sm z-10">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
          {isSaving ? '正在保存...' : '新增记录'}
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-8">
        {step === 1 ? (
          <>
            {/* Step 1: Basic Info */}
            <div className="space-y-6">
              {/* Image Upload First */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">封面图 *</Label>
                {!mainImage && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera size={32} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">上传照片</span>
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={(e) => handleImageUpload(e, true)} 
                      />
                    </div>
                    
                    <button 
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card"
                    >
                      <Smile size={32} className="text-muted-foreground/40 group-hover:text-primary transition-colors mb-2" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">选择 Emoji</span>
                    </button>
                  </div>
                )}

                <EmojiPicker
                  isOpen={isEmojiPickerOpen}
                  onClose={() => setIsEmojiPickerOpen(false)}
                  onSelect={(emoji) => {
                    setMainImage(emoji);
                    setIsEmojiMain(true);
                  }}
                  currentEmoji={isEmojiMain ? mainImage : undefined}
                />
                
                {mainImage && (
                  <div className="mt-4 relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-border group">
                    {isEmojiMain ? (
                      <div className="w-full h-full flex items-center justify-center text-7xl bg-muted/30">{mainImage}</div>
                    ) : (
                      <img src={mainImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-2">
                      {!isEmojiMain && (
                        <button 
                          onClick={() => setCropTarget({ type: 'main', src: mainImage })}
                          className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <Scissors size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setMainImage('')}
                        className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">作品名称 *</Label>
                <Input 
                  placeholder="请输入名称" 
                  value={workName} 
                  onChange={(e) => {
                    setWorkName(e.target.value);
                    setSelectedWorkId(null);
                  }}
                  className="rounded-xl border-border bg-card focus:ring-primary"
                />
                
                {/* Matching Works */}
                {matchingWorks.length > 0 && !selectedWorkId && (
                  <div className="mt-2 p-3 bg-muted/30 rounded-xl border border-border space-y-2 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">可能已有作品：</p>
                    <div className="flex flex-wrap gap-2">
                      {matchingWorks.map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setWorkName(w.name);
                            setSelectedWorkId(w.id);
                            setCategoryId(w.categoryId);
                          }}
                          className="text-xs bg-card border border-border px-3 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <Check size={12} /> {w.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">分类 *</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={!!selectedWorkId}>
                  <SelectTrigger className="rounded-xl border-border bg-card">
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
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">制作日期 *</Label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border-border bg-card"
                />
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
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">口味（选填）</Label>
                  <Input 
                    placeholder="例如：橙子、巧克力" 
                    value={taste} 
                    onChange={(e) => setTaste(e.target.value)}
                    className="rounded-xl border-border bg-card"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">记录名称（选填）</Label>
                <Input 
                  placeholder="默认：作品名称，可自行修改" 
                  value={recordTitle} 
                  onChange={(e) => setRecordTitle(e.target.value)}
                  className="rounded-xl border-border bg-card"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">评价（选填）</Label>
                <Textarea 
                  placeholder="这次状态比上次更稳……" 
                  value={evaluation} 
                  onChange={(e) => setEvaluation(e.target.value)}
                  className="rounded-xl border-border bg-card min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">备忘（选填）</Label>
                <Textarea 
                  placeholder="下次少放一点糖……" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl border-border bg-card min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">其他照片 (最多 2 张)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {extraImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-border group">
                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button 
                          onClick={() => setCropTarget({ type: 'extra', index: idx, src: img })}
                          className="bg-black/50 text-white p-1 rounded-full"
                        >
                          <Scissors size={12} />
                        </button>
                        <button 
                          onClick={() => setExtraImages(prev => prev.filter((_, i) => i !== idx))}
                          className="bg-black/50 text-white p-1 rounded-full"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {extraImages.length < 2 && (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group bg-card">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                      <PlusCircle size={24} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
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

      {/* Cropper Modal */}
      {cropTarget && (
        <ImageCropperModal
          isOpen={!!cropTarget}
          imageSrc={cropTarget.src}
          onClose={() => setCropTarget(null)}
          onCropComplete={(croppedBase64) => {
            if (cropTarget.type === 'main') {
              setMainImage(croppedBase64);
            } else if (cropTarget.type === 'extra' && cropTarget.index !== undefined) {
              setExtraImages(prev => {
                const newExtra = [...prev];
                newExtra[cropTarget.index!] = croppedBase64;
                return newExtra;
              });
            }
          }}
        />
      )}

      {/* Milestone overlays */}
      {dishMilestone && (
        <MilestoneBadgeModal
          isOpen={!!dishMilestone}
          count={dishMilestone.count}
          workName={dishMilestone.workName}
          onContinue={handleDishMilestoneContinue}
        />
      )}
      <WorksMilestoneScreen
        isOpen={!!worksMilestone}
        total={worksMilestone?.total ?? 0}
        onContinue={handleWorksMilestoneContinue}
      />
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
