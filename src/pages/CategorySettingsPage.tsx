import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Edit3, Trash2, Check, X, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category } from '../types';

const CategorySettingsPage = () => {
  const { data, addCategory, updateCategory, deleteCategory, reorderCategories, moveWorksToCategory } = useApp();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🍽️');
  const [newSupportsTaste, setNewSupportsTaste] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  
  const [isPendingDelete, setIsPendingDelete] = useState<string | null>(null);
  const deleteTimeoutRef = React.useRef<any>(null);

  const sortedCategories = useMemo(() => {
    // 过滤掉正在等待删除的分类
    return [...data.categories]
      .filter(c => c.id !== isPendingDelete)
      .sort((a, b) => a.order - b.order);
  }, [data.categories, isPendingDelete]);

  React.useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

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
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateCategory(editingId, { name: editName });
      setEditingId(null);
    }
  };

  const handleDelete = (id: string, force: boolean = false) => {
    const cat = data.categories.find(c => c.id === id);
    if (!cat) return;
    
    const hasWorks = data.works.some(w => w.categoryId === id);
    if (hasWorks && !force) {
      setConfirmDeleteId(id);
      setShowMoveOptions(true);
      return;
    }

    // 进入待删除状态
    setConfirmDeleteId(null);
    setShowMoveOptions(false);
    setIsPendingDelete(id);
    
    deleteTimeoutRef.current = setTimeout(() => {
      deleteCategory(id, force);
      setIsPendingDelete(null);
    }, 5000);
  };

  const cancelDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    setIsPendingDelete(null);
  };

  const handleMoveAndDelete = (id: string) => {
    if (!targetCategoryId) return;
    moveWorksToCategory(id, targetCategoryId);
    handleDelete(id, false); // 此时已无作品，直接删除分类
  };

  return (
    <div className="min-h-screen bg-white pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">分类设置</h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-8">
        {/* Category List */}
        <div className="space-y-4">
          {sortedCategories.map((cat, idx) => (
            <div key={cat.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveCategory(idx, 'up'); }}
                      disabled={idx === 0}
                      className="p-1 text-gray-300 hover:text-primary disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveCategory(idx, 'down'); }}
                      disabled={idx === sortedCategories.length - 1}
                      className="p-1 text-gray-300 hover:text-primary disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <span className="text-2xl">{cat.icon}</span>
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm font-bold rounded-lg border-primary/30"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      />
                      <button onClick={saveEdit} className="p-1 text-primary"><Check size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={18} /></button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-gray-900 truncate">{cat.name}</span>
                  )}
                </div>
                {editingId !== cat.id && (
                  <div className="flex items-center gap-2 relative z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(cat);
                      }}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(cat.id); }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">支持口味</Label>
                <Switch 
                  checked={cat.supportsTaste} 
                  onCheckedChange={(checked) => updateCategory(cat.id, { supportsTaste: checked })}
                />
              </div>

              {/* Inline Delete Confirmation */}
              {confirmDeleteId === cat.id && (
                <div className="absolute inset-0 bg-white/98 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                  {!showMoveOptions ? (
                    <>
                      <p className="text-xs font-bold text-gray-900 mb-4">确认删除吗？</p>
                      <div className="flex gap-3 w-full">
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest">取消</Button>
                        <Button variant="destructive" onClick={() => handleDelete(cat.id)} className="flex-1 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest">确认删除</Button>
                      </div>
                    </>
                  ) : (
                      <div className="w-full space-y-4">
                      <div className="text-center space-y-1">
                        <p className="text-[11px] font-bold text-gray-900">该分类下已有作品及记录</p>
                        <p className="text-[10px] text-gray-400">请选择处理方式：</p>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDelete(cat.id, true)} 
                          className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        >
                          连同作品和记录一起删除
                        </Button>
                        <div className="space-y-2 pt-2 border-t border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">将作品迁移至其他类别：</p>
                          <div className="flex gap-2">
                            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                              <SelectTrigger className="flex-1 h-9 rounded-xl text-[10px] font-bold">
                                <SelectValue placeholder="选择目标分类" />
                              </SelectTrigger>
                              <SelectContent>
                                {data.categories.filter(c => c.id !== cat.id).length > 0 ? (
                                  data.categories.filter(c => c.id !== cat.id).map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>无可用分类</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button 
                              disabled={!targetCategoryId}
                              onClick={() => handleMoveAndDelete(cat.id)}
                              className="h-9 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest"
                            >
                              确认移动
                            </Button>
                          </div>
                          <button 
                            onClick={() => { setConfirmDeleteId(null); setShowMoveOptions(false); setIsAdding(true); }}
                            className="text-[10px] text-primary font-bold hover:underline"
                          >
                            + 新增类别
                          </button>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => { setConfirmDeleteId(null); setShowMoveOptions(false); setTargetCategoryId(''); }} 
                          className="w-full h-9 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Undo Toast */}
        {isPendingDelete && (
          <div className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-300 z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-bold">分类及相关记录已删除</p>
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

        {/* Add New Category */}
        {isAdding ? (
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-6 animate-in zoom-in-95">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">新增分类</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">分类名称</Label>
                <Input 
                  placeholder="例如：甜点" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">分类图标 (Emoji)</Label>
                <Input 
                  placeholder="🍽️" 
                  value={newIcon} 
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">是否支持口味</Label>
                <Switch checked={newSupportsTaste} onCheckedChange={setNewSupportsTaste} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsAdding(false)} className="flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-widest">取消</Button>
              <Button onClick={handleAdd} className="flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-widest">保存</Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setIsAdding(true)}
            className="w-full rounded-2xl h-14 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary/30 hover:text-primary transition-all"
          >
            <Plus size={18} className="mr-2" /> 新增分类
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategorySettingsPage;
