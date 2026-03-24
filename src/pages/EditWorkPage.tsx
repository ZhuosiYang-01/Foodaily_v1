import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Smile, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmojiPicker from '../components/EmojiPicker';

const EditWorkPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, updateWork } = useApp();
  const navigate = useNavigate();

  const work = useMemo(() => data.works.find(w => w.id === id), [id, data.works]);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  // State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isEmojiCover, setIsEmojiCover] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  useEffect(() => {
    if (work) {
      setName(work.name);
      setCategoryId(work.categoryId);
      setCoverImage(work.coverImage);
      setIsEmojiCover(work.isEmojiCover);
    }
  }, [work]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
        setIsEmojiCover(false);
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
      isEmojiCover,
      updatedAt: Date.now(),
    });
    navigate(-1);
  };

  if (!work) return null;

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="w-full aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card"
                  onClick={() => setShowPhotoOptions(true)}
                >
                  <Camera size={32} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">上传照片</span>
                </button>
                {showPhotoOptions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-xl border border-border p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => { cameraInputRef.current?.click(); setShowPhotoOptions(false); }}
                      className="w-full text-left px-4 py-3 text-[10px] font-bold text-foreground uppercase tracking-widest hover:bg-muted/50 rounded-xl transition-colors"
                    >
                      拍照上传
                    </button>
                    <button 
                      onClick={() => { galleryInputRef.current?.click(); setShowPhotoOptions(false); }}
                      className="w-full text-left px-4 py-3 text-[10px] font-bold text-foreground uppercase tracking-widest hover:bg-muted/50 rounded-xl transition-colors"
                    >
                      从相册中选择
                    </button>
                    <button 
                      onClick={() => setShowPhotoOptions(false)}
                      className="w-full text-left px-4 py-3 text-[10px] font-bold text-destructive uppercase tracking-widest hover:bg-destructive/5 rounded-xl transition-colors border-t border-border mt-1"
                    >
                      取消
                    </button>
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageUpload} />
                <input type="file" accept="image/*" className="hidden" ref={galleryInputRef} onChange={handleImageUpload} />
              </div>
              
              <button 
                onClick={() => setIsEmojiPickerOpen(true)}
                className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card"
              >
                <Smile size={32} className="text-muted-foreground/40 group-hover:text-primary transition-colors mb-2" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">选择 Emoji</span>
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
              <div className="mt-4 relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-border">
                {isEmojiCover ? (
                  <div className="w-full h-full flex items-center justify-center text-7xl bg-muted/30">{coverImage}</div>
                ) : (
                  <img src={coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
                <button 
                  onClick={() => setCoverImage('')}
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
            onClick={handleSave}
            className="w-full rounded-xl h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            保存修改
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditWorkPage;
