import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, LogOut, Calendar, Download, Upload, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useApp } from '../store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { exportData, importData, clearAllData, data } = useApp();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [importJson, setImportJson] = useState<string | null>(null);
  const [showConfirmExport, setShowConfirmExport] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8) { setError('新密码至少需要 8 位'); return; }
    if (newPassword !== confirmPassword) { setError('两次输入的密码不一致'); return; }

    setLoading(true);
    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInError) {
      setLoading(false);
      setError('当前密码不正确');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message || '修改失败，请重试');
    } else {
      setSuccess('密码已修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    }
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodaily_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowConfirmExport(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportJson(event.target?.result as string);
        setShowConfirmImport(true);
      };
      reader.readAsText(file);
    }
  };

  const handleImportConfirm = () => {
    if (importJson) {
      try {
        importData(importJson, 'replace');
      } catch (e) {
        console.error('Import failed', e);
      }
      setShowConfirmImport(false);
      setImportJson(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      <header className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">我的账号</h2>
        <div className="w-10" />
      </header>

      <div className="p-6 space-y-6">
        {/* Account Info Card */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">绑定邮箱</p>
                <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <Calendar size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">注册时间</p>
                <p className="text-sm font-bold text-foreground">{createdAt}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <button
            onClick={() => { setShowChangePassword(!showChangePassword); setError(''); setSuccess(''); }}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Lock size={18} className="text-blue-500" />
              </div>
              <span className="text-sm font-bold text-foreground">修改密码</span>
            </div>
            <ChevronLeft size={18} className={`text-muted-foreground transition-transform ${showChangePassword ? '-rotate-90' : 'rotate-180'}`} />
          </button>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">当前密码</Label>
                <div className="relative">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码" required
                    className="pr-10 rounded-xl h-11 bg-background border-border"
                  />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">新密码</Label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="至少 8 位" required
                  className="rounded-xl h-11 bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">确认新密码</Label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="再输入一次" required
                  className="rounded-xl h-11 bg-background border-border"
                />
              </div>
              {error && <p className="text-xs text-destructive font-medium">{error}</p>}
              {success && <p className="text-xs text-green-600 font-medium">{success}</p>}
              <Button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-widest">
                {loading ? '修改中...' : '确认修改'}
              </Button>
            </form>
          )}
        </div>

        {/* Export / Import */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <button onClick={() => setShowConfirmExport(true)}
            className="w-full flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Download size={18} className="text-green-500" />
              </div>
              <span className="text-sm font-bold text-foreground">导出数据</span>
            </div>
            <ChevronLeft size={18} className="text-muted-foreground rotate-180" />
          </button>
          <div className="relative">
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Upload size={18} className="text-orange-500" />
                </div>
                <span className="text-sm font-bold text-foreground">导入数据</span>
              </div>
              <ChevronLeft size={18} className="text-muted-foreground rotate-180" />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={onFileChange} />
          </div>
          <button onClick={() => setShowConfirmClear(true)}
            className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <span className="text-sm font-bold text-foreground">清空数据</span>
            </div>
            <ChevronLeft size={18} className="text-muted-foreground rotate-180" />
          </button>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full rounded-xl h-12 text-sm font-bold bg-background text-red-800 border border-border shadow-sm hover:bg-accent hover:text-red-900"
        >
          <LogOut size={16} className="mr-2" /> 退出登录
        </Button>
      </div>

      {/* Export Confirm */}
      {showConfirmExport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-xs space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-border/50">
            <div className="text-center space-y-2">
              <Download size={40} className="mx-auto text-green-500 mb-2" />
              <h3 className="text-lg font-bold text-foreground">导出数据</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">将把以下数据打包为 JSON 文件保存到本机</p>
            </div>
            <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">分类</span>
                <span className="text-foreground">{data.categories.length} 个</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">作品</span>
                <span className="text-foreground">{data.works.length} 个</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">记录</span>
                <span className="text-foreground">{data.records.length} 条</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleExport} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">导出所有数据</Button>
              <Button variant="ghost" onClick={() => setShowConfirmExport(false)} className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirm */}
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

      {/* Clear Confirm */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <Trash2 size={40} className="mx-auto text-destructive mb-2" />
              <h3 className="text-lg font-bold text-foreground">清空所有数据</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">确定清空吗？此操作不可撤销。</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="destructive" onClick={() => { clearAllData(); setShowConfirmClear(false); }}
                className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">确认清空</Button>
              <Button variant="ghost" onClick={() => setShowConfirmClear(false)}
                className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-[280px] space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <LogOut size={40} className="mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-bold text-foreground">退出登录</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">退出后数据仍保留在云端，下次登录可恢复。</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="destructive" onClick={handleLogout}
                className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest">
                确认退出
              </Button>
              <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-2xl h-12 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
