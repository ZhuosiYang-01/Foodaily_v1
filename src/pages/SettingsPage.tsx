import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, Download, Upload, Trash2, Info, User, Check, X, AlertTriangle, Layers } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';

const SettingsPage = () => {
  const { exportData, importData, clearAllData } = useApp();
  const navigate = useNavigate();

  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [importJson, setImportJson] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodaily_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据导出成功');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        setImportJson(json);
        setShowConfirmImport(true);
      };
      reader.readAsText(file);
    }
  };

  const handleImportConfirm = () => {
    if (importJson) {
      try {
        importData(importJson, 'replace');
        showToast('数据导入成功');
      } catch (err) {
        showToast('导入失败，请检查文件格式', 'error');
      }
      setShowConfirmImport(false);
      setImportJson(null);
    }
  };

  const handleClearConfirm = () => {
    clearAllData();
    localStorage.removeItem('foodaily_initialized');
    showToast('数据已清空');
    setShowConfirmClear(false);
  };

  const settingsItems = [
    { to: '/settings/categories', icon: LayoutGrid, label: '分类设置', color: 'text-blue-500 bg-blue-50' },
    { to: '/batch-import', icon: Layers, label: '批量导入记录', color: 'text-orange-500 bg-orange-50' },
    { onClick: handleExport, icon: Download, label: '导出数据', color: 'text-green-500 bg-green-50' },
    { onClick: null, icon: Upload, label: '导入数据', color: 'text-orange-500 bg-orange-50', isFile: true },
    { onClick: () => setShowConfirmClear(true), icon: Trash2, label: '清空数据', color: 'text-red-500 bg-red-50' },
    { to: '/about', icon: Info, label: '关于 Foodaily', color: 'text-gray-500 bg-gray-50' },
  ];

  return (
    <div className="pb-24 pt-6 px-4 space-y-8 animate-in fade-in duration-500 relative min-h-screen bg-background">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User size={24} className="text-primary" /> 设置
        </h1>
      </header>

      {/* Settings List */}
      <div className="space-y-4">
        {settingsItems.map((item, idx) => (
          <div key={idx} className="relative">
            {item.to ? (
              <Link 
                to={item.to}
                className="flex items-center justify-between p-5 bg-card rounded-3xl border border-border/50 shadow-sm group hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-foreground">{item.label}</span>
                </div>
                <ChevronLeft size={18} className="text-muted-foreground rotate-180 group-hover:text-primary transition-colors" />
              </Link>
            ) : (
              <div 
                onClick={item.onClick || undefined}
                className="flex items-center justify-between p-5 bg-card rounded-3xl border border-border/50 shadow-sm group hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-foreground">{item.label}</span>
                </div>
                {item.isFile ? (
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" accept=".json" className="hidden" onChange={onFileChange} />
                  </label>
                ) : null}
                <ChevronLeft size={18} className="text-muted-foreground rotate-180 group-hover:text-primary transition-colors" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <footer className="text-center pt-8 space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Foodaily Version 1.0</p>
      </footer>

      {/* Custom Modals & Toasts */}
      {showConfirmImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-xs space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-border/50">
            <div className="text-center space-y-2">
              <Upload size={40} className="mx-auto text-orange-500 mb-2" />
              <h3 className="text-lg font-bold text-foreground">导入数据</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">导入数据将覆盖当前所有数据，确定继续吗？</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleImportConfirm} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">确认导入</Button>
              <Button variant="ghost" onClick={() => setShowConfirmImport(false)} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">取消</Button>
            </div>
          </div>
        </div>
      )}

      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-xs space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-border/50">
            <div className="text-center space-y-2">
              <AlertTriangle size={40} className="mx-auto text-red-500 mb-2" />
              <h3 className="text-lg font-bold text-foreground">清空数据</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">确定要清空所有数据吗？此操作不可撤销。</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="destructive" onClick={handleClearConfirm} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">确认清空</Button>
              <Button variant="ghost" onClick={() => setShowConfirmClear(false)} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">取消</Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-24 left-4 right-4 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 z-50 ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <Check size={18} className="text-primary" /> : <X size={18} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
