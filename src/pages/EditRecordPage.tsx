import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Smile, X, PlusCircle, Scissors } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import EmojiPicker from '../components/EmojiPicker';
import ImageCropperModal from '../components/ImageCropperModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage, extractPhotoDate } from '../lib/imageUtils';

const EditRecordPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, updateRecord } = useApp();
  const navigate = useNavigate();

  const record = useMemo(() => data.records.find(r => r.id === id), [id, data.records]);
  const work = useMemo(() => data.works.find(w => w.id === record?.workId), [record, data.works]);
  const category = useMemo(() => data.categories.find(c => c.id === work?.categoryId), [work, data.categories]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [workName, setWorkName] = useState('');
  const [title, setTitle] = useState('');
  const [hasManuallyEditedTitle, setHasManuallyEditedTitle] = useState(false);
  const [taste, setTaste] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [notes, setNotes] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [originalMainImage, setOriginalMainImage] = useState<string | undefined>();
  const [isEmojiMain, setIsEmojiMain] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [cropTarget, setCropTarget] = useState<{ type: 'main' | 'extra', index?: number, src: string } | null>(null);
  const [showWorkAutocomplete, setShowWorkAutocomplete] = useState(false);

  useEffect(() => {
    if (record) {
      setDate(record.date);
      setCategoryId(work?.categoryId || '');
      setWorkName(work?.name || '');
      setTitle(record.title);
      setTaste(record.taste || '');
      setEvaluation(record.evaluation);
      setNotes(record.notes);
      setMainImage(record.mainImage);
      setOriginalMainImage(record.originalMainImage);
      setIsEmojiMain(record.isEmojiMain);
      setExtraImages(record.extraImages || []);
      // If title matches auto-generated pattern, allow auto-update; otherwise protect it
      const autoTitle = record.taste ? `${record.taste}${work?.name}` : work?.name;
      setHasManuallyEditedTitle(record.title !== autoTitle);
    }
  }, [record, work]);

  // Auto-update title when taste or workName changes (only if user hasn't manually edited it)
  useEffect(() => {
    if (hasManuallyEditedTitle) return;
    if (taste && workName) {
      setTitle(`${taste}${workName}`);
    } else if (workName) {
      setTitle(workName);
    }
  }, [taste, workName]);

  const selectedCategory = useMemo(() => data.categories.find(c => c.id === categoryId), [categoryId, data.categories]);

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
    e.target.value = '';
  };

  const handleSave = () => {
    if (!id || isSaving) return;
    setIsSaving(true);

    try {
      updateRecord(id, {
        date,
        title,
        taste: selectedCategory?.supportsTaste ? taste : '',
        evaluation,
        notes,
        mainImage,
        originalMainImage,
        isEmojiMain,
        extraImages,
      }, {
        name: workName,
        categoryId: categoryId
      });
      
      setTimeout(() => {
        navigate(`/record/${id}`, { replace: true });
      }, 50);
    } catch (error) {
      console.error('Update failed:', error);
      setIsSaving(false);
      alert('保存失败，请重试');
    }
  };

  if (!record) return null;

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">编辑记录</h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">制作日期 *</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border-border bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">作品名称 *</Label>
            <div className="relative">
              <Input
                placeholder="请输入作品名称"
                value={workName}
                onChange={(e) => {
                  const newWorkName = e.target.value;
                  setWorkName(newWorkName);
                  setShowWorkAutocomplete(!!newWorkName);
                  if (!hasManuallyEditedTitle) {
                    setTitle(newWorkName);
                  }
                }}
                onFocus={() => workName && setShowWorkAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowWorkAutocomplete(false), 150)}
                className="rounded-xl border-border bg-card"
              />
              {showWorkAutocomplete && (() => {
                const q = workName.toLowerCase();
                const candidates = data.works
                  .map(w => w.name)
                  .filter((n, idx, arr) => arr.indexOf(n) === idx)
                  .filter(n => n.toLowerCase().includes(q) && n !== workName);
                if (candidates.length === 0) return null;
                return (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {candidates.slice(0, 5).map(name => (
                      <button
                        key={name}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setWorkName(name);
                          if (!hasManuallyEditedTitle) setTitle(name);
                          setShowWorkAutocomplete(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors truncate"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">分类 *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
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
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">记录名称 *</Label>
            <Input 
              placeholder="请输入记录名称" 
              value={title} 
              onChange={(e) => {
                setTitle(e.target.value);
                setHasManuallyEditedTitle(true);
              }}
              className="rounded-xl border-border bg-card"
            />
          </div>

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
                      <PlusCircleIcon size={24} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
            保存修改
          </Button>
        </div>
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
    </div>
  );
};

const PlusCircleIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export default EditRecordPage;
