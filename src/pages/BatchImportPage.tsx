import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Upload, 
  X, 
  Loader2, 
  Calendar, 
  Tag, 
  Type,
  AlertCircle,
  Scissors
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage, extractPhotoDate } from '../lib/imageUtils';
import ImageCropperModal from '../components/ImageCropperModal';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface BatchItem {
  id: string;
  file: File;
  preview: string;
  name: string;
  date: string;
  categoryId: string;
  error?: string;
  isProcessing: boolean;
}

const BatchImportPage = () => {
  const { data, batchAddRecords } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const MAX_BATCH_ITEMS = 20;

  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchCategory, setBatchCategory] = useState<string>('');
  const [guideStep, setGuideStep] = useState<number>(0); // 0: none, 1: batch cat, 2: name, 3: limits
  const [isSaving, setIsSaving] = useState(false);
  const [cropTarget, setCropTarget] = useState<{ id: string, src: string } | null>(null);
  const [autocompleteItemId, setAutocompleteItemId] = useState<string | null>(null);

  // Refs for guide positioning
  const batchCatRef = useRef<HTMLDivElement>(null);
  const firstItemNameRef = useRef<HTMLDivElement>(null);

  const makeBatchId = () => {
    // Some mobile browsers / WebViews don't support crypto.randomUUID().
    const canRandomUUID =
      typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function';
    if (canRandomUUID) return crypto.randomUUID();
    return `batch_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];

    if (files.length === 0) return;

    if (fileInputRef.current) fileInputRef.current.value = '';

    const remaining = MAX_BATCH_ITEMS - items.length;
    if (remaining <= 0) {
      toast({
        title: '照片数量已达上限',
        description: `一次最多导入 ${MAX_BATCH_ITEMS} 张`,
        variant: 'destructive',
      });
      return;
    }

    let filesToAdd = files;
    if (files.length > remaining) {
      filesToAdd = files.slice(0, remaining);
      toast({
        title: '照片数量超出限制',
        description: `一次最多导入 ${MAX_BATCH_ITEMS} 张，已自动保留前 ${MAX_BATCH_ITEMS} 张`,
        variant: 'destructive',
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // 立刻把每张图作为 isProcessing:true 的卡片显示出来，不阻塞 UI
    let placeholders: BatchItem[] = [];
    placeholders = filesToAdd.map(file => ({
      id: makeBatchId(),
      file,
      preview: '',
      name: '',
      date: today,
      categoryId: '',
      isProcessing: true,
    }));

    setItems(prev => [...prev, ...placeholders]);
    setIsProcessing(true);

    // 逐张在后台处理，处理完就更新对应卡片
    let completedCount = 0;
    placeholders.forEach(async (placeholder) => {
      try {
        const [date, compressed] = await Promise.all([
          extractPhotoDate(placeholder.file),
          compressImage(placeholder.file, 1080, 0.85),
        ]);
        setItems(prev => prev.map(i =>
          i.id === placeholder.id
            ? { ...i, preview: compressed, date: date || today, isProcessing: false }
            : i
        ));
      } catch {
        setItems(prev => prev.map(i =>
          i.id === placeholder.id
            ? { ...i, preview: URL.createObjectURL(placeholder.file), date: today, isProcessing: false, error: '处理失败' }
            : i
        ));
      } finally {
        completedCount++;
        if (completedCount === placeholders.length) {
          setIsProcessing(false);
          if (localStorage.getItem('foodaily_batch_guide_shown') !== 'true') {
            setGuideStep(1);
          }
            
        }
      }
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, error: updates.categoryId ? undefined : i.error } : i));
  };

  const applyBatchCategory = () => {
    if (!batchCategory) return;
    setItems(prev => prev.map(i => ({ ...i, categoryId: batchCategory, error: undefined })));
  };

  const handleSaveAll = async () => {
    // Validation: name and category both required
    const firstErrorItem = items.find(i => !i.name.trim() || !i.categoryId);
    if (firstErrorItem) {
      setItems(prev => prev.map(i => ({
        ...i,
        error: !i.name.trim() ? '请填写名称' : !i.categoryId ? '请选择分类' : undefined,
      })));
      const errorEl = document.getElementById(`item-${firstErrorItem.id}`);
      if (errorEl) errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSaving(true);
    try {
      const batchItems = items.map(item => ({
        record: {
          workId: '',
          date: item.date,
          mainImage: item.preview,
          isEmojiMain: false,
          title: item.name,
          evaluation: '',
          notes: '',
          extraImages: []
        },
        workInfo: {
          name: item.name,
          categoryId: item.categoryId,
          coverImage: item.preview,
          isEmoji: false
        }
      }));

      batchAddRecords(batchItems);
      navigate('/');
    } catch (error) {
      console.error('Failed to save batch:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const finishGuide = () => {
    setGuideStep(0);
    localStorage.setItem('foodaily_batch_guide_shown', 'true');
  };

  return (
    <div 
      className="absolute inset-0 bg-background z-[100] flex flex-col animate-in slide-in-from-bottom duration-500" 
      style={{ touchAction: 'pan-y' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 bg-background shadow-sm shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
          批量导入记录 {items.length > 0 && `(${items.length})`}
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary font-bold text-xs"
          onClick={handleSaveAll}
          disabled={items.length === 0 || isSaving || isProcessing}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : '保存'}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 space-y-6">
          {/* Input always in DOM — avoids iOS PWA programmatic-click bug */}
          <input
            id="batch-file-input"
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />

          {items.length === 0 ? (
            <label
              htmlFor="batch-file-input"
              className="aspect-[4/5] rounded-[2.5rem] border-2 border-dashed border-border/50 flex flex-col items-center justify-center space-y-4 bg-card/30 hover:bg-card/50 transition-colors cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-foreground">点击选择多张照片</p>
                <p className="text-xs text-muted-foreground">支持一次最多 {MAX_BATCH_ITEMS} 张</p>
              </div>
            </label>
          ) : (
            <div className="space-y-6">
              {/* Batch Category Tool */}
              <div 
                ref={batchCatRef}
                className="bg-card rounded-3xl p-4 border border-border/50 shadow-sm space-y-3 relative z-20"
              >
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">批量设置分类</Label>
                <div className="flex gap-2">
                  <Select value={batchCategory} onValueChange={setBatchCategory}>
                    <SelectTrigger className="flex-1 rounded-2xl h-11 bg-background border-border text-xs font-bold">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {data.categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                  <Button 
                    onClick={applyBatchCategory}
                    disabled={!batchCategory}
                    className="rounded-2xl h-11 px-6 text-xs font-bold uppercase tracking-widest"
                  >
                    应用全部
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4" ref={scrollContainerRef}>
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      id={`item-${item.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: item.error ? [1, 1.02, 1] : 1,
                        borderColor: item.error ? '#ef4444' : 'rgba(0,0,0,0.1)'
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "bg-card rounded-[2rem] p-4 border shadow-sm relative group",
                        item.error ? "border-destructive ring-1 ring-destructive/20" : "border-border/50"
                      )}
                    >
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors z-10"
                      >
                        <X size={16} />
                      </button>

                      <div className="flex gap-4 items-start">
                        {/* Preview */}
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted flex-shrink-0 relative mt-1 group">
                          {item.isProcessing ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                              <Loader2 size={24} className="animate-spin text-primary" />
                            </div>
                          ) : (
                            <>
                              <img src={item.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                onClick={() => setCropTarget({ id: item.id, src: item.preview })}
                                className="absolute bottom-1 right-1 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                              >
                                <Scissors size={12} />
                              </button>
                            </>
                          )}
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          {/* Row 1: Name */}
                          <div className="flex items-center gap-2" ref={index === 0 ? firstItemNameRef : null}>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-8 shrink-0">
                              名称
                            </span>
                            <div className="flex-1 relative">
                              <Input
                                placeholder="作品名称 *"
                                value={item.name}
                                onChange={(e) => {
                                  updateItem(item.id, { name: e.target.value });
                                  setAutocompleteItemId(e.target.value ? item.id : null);
                                }}
                                onFocus={() => item.name && setAutocompleteItemId(item.id)}
                                onBlur={() => setTimeout(() => setAutocompleteItemId(null), 150)}
                                className={cn(
                                  "h-10 rounded-xl bg-background border-border text-xs focus-visible:ring-primary/20 w-full",
                                  item.error === '请填写名称' && "border-destructive"
                                )}
                              />
                              {autocompleteItemId === item.id && (() => {
                                const q = item.name.toLowerCase();
                                const existingNames = data.works.map(w => w.name);
                                const batchNames = items
                                  .filter(i => i.id !== item.id && i.name.trim())
                                  .map(i => i.name.trim());
                                const candidates = [...new Set([...existingNames, ...batchNames])]
                                  .filter(n => n.toLowerCase().includes(q) && n !== item.name);
                                if (candidates.length === 0) return null;
                                return (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                                    {candidates.slice(0, 5).map(name => (
                                      <button
                                        key={name}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          updateItem(item.id, { name });
                                          setAutocompleteItemId(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors truncate"
                                      >
                                        {name}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Row 2: Date */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-8 shrink-0">
                              日期
                            </span>
                            <Input 
                              type="date"
                              value={item.date}
                              onChange={(e) => updateItem(item.id, { date: e.target.value })}
                              className="h-10 rounded-xl bg-background border-border text-xs px-3 focus-visible:ring-primary/20 flex-1"
                            />
                          </div>

                          {/* Row 3: Category */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-8 shrink-0">
                              分类
                            </span>
                            <Select 
                              value={item.categoryId} 
                              onValueChange={(v) => updateItem(item.id, { categoryId: v })}
                            >
                              <SelectTrigger className={cn(
                                "h-10 rounded-xl bg-background border-border text-xs px-3 focus:ring-primary/20 flex-1",
                                item.error && "border-destructive text-destructive"
                              )}>
                                <SelectValue placeholder="选择分类" />
                              </SelectTrigger>
                              <SelectContent className="z-[110]">
                                {data.categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {item.error && (
                            <p className="text-[10px] font-bold text-destructive px-1 animate-pulse ml-10">
                              {item.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-background border-t border-border/50 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] z-20">
                <Button 
                  onClick={handleSaveAll}
                  disabled={isSaving || isProcessing}
                  className="w-full rounded-2xl h-14 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      正在保存 ({items.length})...
                    </span>
                  ) : (
                    `确认保存全部 (${items.length})`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Onboarding Guide Overlay */}
      <AnimatePresence>
        {guideStep > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
          >
            {/* Step 1: Batch Category */}
            {guideStep === 1 && (
              <div className="absolute top-[160px] left-4 right-4 space-y-2">
                <div className="bg-white rounded-2xl p-4 shadow-2xl border border-primary/20 animate-in zoom-in-95 duration-300">
                  <h4 className="text-sm font-bold text-foreground mb-1">快捷分类 (1/2)</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">您可以一键为所有照片设置相同分类</p>
                  <div className="flex justify-end mt-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setGuideStep(3);
                      }}
                      className="h-8 rounded-lg text-[10px] font-bold px-4"
                    >
                      下一步
                    </Button>
                  </div>
                </div>
                <div className="w-4 h-4 bg-white rotate-45 mx-auto -mt-2 border-l border-t border-primary/20" />
              </div>
            )}

            {/* Step 2: Limits */}
            {guideStep === 3 && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl border border-primary/20"
              >
                <div className="text-center space-y-2">
                  <AlertCircle size={40} className="mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-bold text-foreground">功能限制 (2/2)</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    批量模式暂不支持添加备忘、评价以及其他照片
                  </p>
                </div>
                <Button onClick={finishGuide} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">开始使用</Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cropper Modal */}
      {cropTarget && (
        <ImageCropperModal
          isOpen={!!cropTarget}
          imageSrc={cropTarget.src}
          onClose={() => setCropTarget(null)}
          onCropComplete={(croppedBase64) => {
            updateItem(cropTarget.id, { preview: croppedBase64 });
          }}
        />
      )}
    </div>
  );
};

export default BatchImportPage;
