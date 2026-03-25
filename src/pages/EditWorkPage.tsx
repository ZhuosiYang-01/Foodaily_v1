import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Smile, X, Scissors, Images, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker from '../components/EmojiPicker';
import ImageCropperModal from '../components/ImageCropperModal';

const EditWorkPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, updateWork, deleteWork } = useApp();
  const navigate = useNavigate();

  const work = useMemo(() => data.works.find(w => w.id === id), [id, data.works]);

  const allRecordImages = useMemo(() => {
    if (!id) return [];
    const images: string[] = [];
    const workRecords = data.records.filter(r => r.workId === id);
    workRecords.forEach(r => {
      if (!r.isEmojiMain && r.mainImage) images.push(r.mainImage);
      if (r.extraImages) images.push(...r.extraImages);
    });
    return images;
  }, [id, data.records]);

  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  // State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [originalCoverImage, setOriginalCoverImage] = useState<string | undefined>();
  const [isEmojiCover, setIsEmojiCover] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [cropTarget, setCropTarget] = useState<string | null>(null);
  const [showRecordPicker, setShowRecordPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (work) {
      setName(work.name);
      setCategoryId(work.categoryId);
      setCoverImage(work.coverImage);
      setOriginalCoverImage(work.originalCoverImage);
      setIsEmojiCover(work.isEmojiCover);
    }
  }, [work]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCoverImage(result);
        setOriginalCoverImage(result);
        setIsEmojiCover(false);
        setCropTarget(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!id) return;
    updateWork(id, {
      name,
      categoryId,
      coverImage,
      originalCoverImage,
      isEmojiCover,
      isManualCover: true,
      updatedAt: Date.now(),
    });
    navigate(-1);
  };

  if (!work) return null;

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">编辑作品</h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">作品名称 *</Label>
            <Input 
              placeholder="请输入名称" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-border bg-card"
            />
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
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">封面图 *</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <button
                  type="button"
                  className="w-full aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card"
                  onClick={() => setShowPhotoOptions(true)}
                >
                  <Camera size={24} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">上传照片</span>
                </button>
                {showPhotoOptions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPhotoOptions(false)} />
                    <div className="absolute top-full left-0 mt-2 bg-card rounded-2xl shadow-xl border border-border p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200 w-max">
                      <button
                        onClick={() => { cameraInputRef.current?.click(); setShowPhotoOptions(false); }}
                        className="w-full text-left px-4 py-3 text-[10px] font-bold text-foreground uppercase tracking-widest hover:bg-muted/50 rounded-xl transition-colors whitespace-nowrap"
                      >
                        拍照上传
                      </button>
                      <button
                        onClick={() => { galleryInputRef.current?.click(); setShowPhotoOptions(false); }}
                        className="w-full text-left px-4 py-3 text-[10px] font-bold text-foreground uppercase tracking-widest hover:bg-muted/50 rounded-xl transition-colors whitespace-nowrap"
                      >
                        从相册中选择
                      </button>
                      <button
                        onClick={() => setShowPhotoOptions(false)}
                        className="w-full text-left px-4 py-3 text-[10px] font-bold text-destructive uppercase tracking-widest hover:bg-destructive/5 rounded-xl transition-colors border-t border-border mt-1 whitespace-nowrap"
                      >
                        取消
                      </button>
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageUpload} />
                <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleImageUpload} />
              </div>

              <button
                onClick={() => setIsEmojiPickerOpen(true)}
                className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card"
              >
                <Smile size={24} className="text-muted-foreground/40 group-hover:text-primary transition-colors mb-1.5" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">选择 Emoji</span>
              </button>

              <button
                onClick={() => setShowRecordPicker(true)}
                disabled={allRecordImages.length === 0}
                className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Images size={24} className="text-muted-foreground/40 group-hover:text-primary transition-colors mb-1.5" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">从记录中选择</span>
              </button>
            </div>

            <EmojiPicker
              isOpen={isEmojiPickerOpen}
              onClose={() => setIsEmojiPickerOpen(false)}
              onSelect={(emoji) => {
                setCoverImage(emoji);
                setIsEmojiCover(true);
              }}
              currentEmoji={isEmojiCover ? coverImage : undefined}
            />
            
            {coverImage && (
              <div className="mt-4 relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-border group">
                {isEmojiCover ? (
                  <div className="w-full h-full flex items-center justify-center text-7xl bg-muted/30">{coverImage}</div>
                ) : (
                  <img src={coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
                
                <div className="absolute top-2 right-2 flex gap-2">
                  {!isEmojiCover && (
                    <button 
                      onClick={() => setCropTarget(coverImage)}
                      className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <Scissors size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => setCoverImage('')}
                    className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button
            onClick={handleSave}
            className="w-full rounded-xl h-12 text-sm font-bold uppercase tracking-widest bg-background text-foreground border border-border shadow-sm hover:bg-accent"
          >
            保存修改
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-xl h-12 text-sm font-bold bg-background text-red-800 border border-border shadow-sm hover:bg-accent hover:text-red-900"
          >
            删除作品
          </Button>
        </div>
      </div>

      {/* Record Image Picker */}
      <AnimatePresence>
        {showRecordPicker && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRecordPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-background rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex-shrink-0 p-6 pb-4 flex items-center justify-between border-b border-border/50">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">从记录中选择封面</h3>
                <button onClick={() => setShowRecordPicker(false)} className="p-2 hover:bg-accent rounded-full transition-colors">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="grid grid-cols-3 gap-2">
                  {allRecordImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCoverImage(img);
                        setOriginalCoverImage(img);
                        setIsEmojiCover(false);
                        setShowRecordPicker(false);
                      }}
                      className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                    >
                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <Trash2 size={40} className="mx-auto text-destructive mb-2" />
              <h3 className="text-lg font-bold text-foreground">删除作品</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">确认删除该作品及其所有记录吗？</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                variant="destructive"
                onClick={() => {
                  if (!id) return;
                  deleteWork(id);
                  navigate(-2);
                }}
                className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest"
              >
                确认删除
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropTarget && (
        <ImageCropperModal
          isOpen={!!cropTarget}
          imageSrc={cropTarget}
          onClose={() => setCropTarget(null)}
          onCropComplete={(croppedBase64) => {
            setCoverImage(croppedBase64);
          }}
        />
      )}
    </div>
  );
};

export default EditWorkPage;
