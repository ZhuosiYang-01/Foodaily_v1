import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Edit3, Trash2, Check, X, ArrowUp, ArrowDown, RotateCcw, Smile, GitMerge } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '../types';
import EmojiPicker from '../components/EmojiPicker';

const CategorySettingsPage = () => {
  const { data, addCategory, updateCategory, deleteCategory, reorderCategories, moveWorksToCategory, mergeDuplicateWorks } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🍽️');
  const [newSupportsTaste, setNewSupportsTaste] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [isEditEmojiPickerOpen, setIsEditEmojiPickerOpen] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  
  const sortedCategories = useMemo(() => {
    return [...data.categories]
      .sort((a, b) => a.order - b.order);
  }, [data.categories]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory({ name: newName, icon: newIcon, supportsTaste: newSupportsTaste });
    setNewName('');
    setIsAdding(false);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...sortedCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    reorderCategories(newCategories);
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateCategory(editingId, { name: editName, icon: editIcon });
      setEditingId(null);
    }
  };

  const handleDelete = (id: string, force: boolean = false) => {
    deleteCategory(id, force);
    setConfirmDeleteId(null);
    setShowMoveOptions(false);
  };

  const handleMoveAndDelete = (id: string) => {
    if (!targetCategoryId) return;
    moveWorksToCategory(id, targetCategoryId);
    handleDelete(id, false); // 此时已无作品，直接删除分类
  };

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">分类设置</h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-8">
        {/* Category List */}
        <div className="space-y-4">
          {sortedCategories.map((cat, idx) => (
            <div key={cat.id} className="bg-card rounded-3xl p-5 border border-border shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveCategory(idx, 'up'); }}
                      disabled={idx === 0}
                      className="p-1 text-muted-foreground/40 hover:text-primary disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveCategory(idx, 'down'); }}
                      disabled={idx === sortedCategories.length - 1}
                      className="p-1 text-muted-foreground/40 hover:text-primary disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  {editingId === cat.id ? (
                    <>
                      <button
                        onClick={() => setIsEditEmojiPickerOpen(true)}
                        className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors shrink-0"
                      >
                        {editIcon}
                      </button>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm font-bold rounded-lg border-primary/30 bg-background"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        />
                        <button onClick={saveEdit} className="p-1 text-primary"><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground"><X size={18} /></button>
                      </div>
                      <EmojiPicker
                        isOpen={isEditEmojiPickerOpen}
                        onClose={() => setIsEditEmojiPickerOpen(false)}
                        onSelect={(emoji) => setEditIcon(emoji)}
                        currentEmoji={editIcon}
                      />
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-sm font-bold text-foreground truncate">{cat.name}</span>
                    </>
                  )}
                </div>
                {editingId !== cat.id && (
                  <div className="flex items-center gap-2 relative z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(cat);
                      }}
                      className="p-2 text-muted-foreground/60 hover:text-primary transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const hasWorks = data.works.some(w => w.categoryId === cat.id);
                        setConfirmDeleteId(cat.id);
                        if (hasWorks) {
                          setShowMoveOptions(true);
                        } else {
                          setShowMoveOptions(false);
                        }
                      }}
                      className="p-2 text-muted-foreground/60 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">支持口味</Label>
                <Switch 
                  checked={cat.supportsTaste} 
                  onCheckedChange={(checked) => updateCategory(cat.id, { supportsTaste: checked })}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Merge Duplicates */}
        <Button
          variant="outline"
          onClick={() => {
            const seen = new Set<string>();
            let dupCount = 0;
            for (const w of data.works) {
              const key = `${w.categoryId}::${w.name}`;
              if (seen.has(key)) dupCount++;
              else seen.add(key);
            }
            mergeDuplicateWorks();
            toast({ title: dupCount > 0 ? `已合并 ${dupCount} 个重复作品` : '没有需要合并的重复作品' });
          }}
          className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest border-border text-muted-foreground bg-card/50 hover:text-primary hover:border-primary/30 transition-all"
        >
          <GitMerge size={16} className="mr-2" /> 合并同名作品
        </Button>

        {/* Add New Category */}
        {isAdding ? (
          <div className="bg-muted/20 rounded-3xl p-6 border border-border space-y-6 animate-in zoom-in-95">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">新增分类</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">分类名称</Label>
                <Input 
                  placeholder="例如：甜点" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border-border bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">分类图标 (Emoji)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="🍽️" 
                    value={newIcon} 
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="rounded-xl border-border bg-card flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setIsEmojiPickerOpen(true)}
                    className="rounded-xl px-3 border-border bg-card"
                  >
                    <Smile size={18} />
                  </Button>
                </div>
              </div>

              <EmojiPicker
                isOpen={isEmojiPickerOpen}
                onClose={() => setIsEmojiPickerOpen(false)}
                onSelect={(emoji) => setNewIcon(emoji)}
                currentEmoji={newIcon}
              />
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase">是否支持口味</Label>
                <Switch checked={newSupportsTaste} onCheckedChange={setNewSupportsTaste} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-widest border-border">取消</Button>
              <Button onClick={handleAdd} className="flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-widest">保存</Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setIsAdding(true)}
            className="w-full rounded-2xl h-14 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all bg-card/50"
          >
            <Plus size={18} className="mr-2" /> 新增分类
          </Button>
        )}
      </div>

      {/* Global Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2.5rem] p-6 w-full max-w-[360px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            {!showMoveOptions ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-foreground">确认删除该分类吗？</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmDeleteId(null)} 
                    className="flex-1 h-12 rounded-2xl text-xs font-bold uppercase tracking-widest border-border"
                  >
                    返回
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(confirmDeleteId)} 
                    className="flex-1 h-12 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-destructive/20"
                  >
                    确认删除
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-destructive">删除此分类会删除所有的作品和记录</p>
                  <p className="text-xs text-muted-foreground">请选择处理方式</p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(confirmDeleteId, true)} 
                    className="w-full h-12 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-destructive/20"
                  >
                    确认删除全部
                  </Button>
                  
                  <div className="relative flex items-center justify-center py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50"></span>
                    </div>
                    <span className="relative px-4 bg-card text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">或</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">迁移至其他分类</p>
                    <div className="flex flex-col gap-2">
                      <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                        <SelectTrigger className="w-full h-10 rounded-2xl text-xs font-bold border-border bg-background">
                          <SelectValue placeholder="选择目标分类" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border bg-card">
                          {data.categories.filter(c => c.id !== confirmDeleteId).length > 0 ? (
                            data.categories.filter(c => c.id !== confirmDeleteId).map(c => (
                              <SelectItem key={c.id} value={c.id} className="rounded-xl">{c.icon} {c.name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>无可用分类</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button 
                        disabled={!targetCategoryId}
                        onClick={() => handleMoveAndDelete(confirmDeleteId)}
                        className="w-full h-10 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
                      >
                        确认移动并删除
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-1 text-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => { setConfirmDeleteId(null); setShowMoveOptions(false); setTargetCategoryId(''); }} 
                      className="h-9 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:bg-transparent hover:text-foreground"
                    >
                      返回
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySettingsPage;
