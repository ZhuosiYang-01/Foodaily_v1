import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'password' | 'otp' | 'otp_sent';

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message);
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setLoading(false);
    if (error) {
      setError(error.message.includes('not found') ? '该邮箱尚未注册' : error.message);
    } else {
      setMode('otp_sent');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    setLoading(false);
    if (error) {
      setError('验证码错误或已过期');
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-16 pb-8">
      <div className="mb-10 space-y-1">
        <h1 className="text-3xl font-bold text-foreground serif">Foodaily</h1>
        <p className="text-sm text-muted-foreground">Your Daily Cooking Gallery</p>
      </div>

      {/* Mode Tabs */}
      {mode !== 'otp_sent' && (
        <div className="flex mb-8 bg-muted/40 rounded-2xl p-1 gap-1">
          <button
            onClick={() => { setMode('password'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              mode === 'password' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            密码登录
          </button>
          <button
            onClick={() => { setMode('otp'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              mode === 'otp' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            验证码登录
          </button>
        </div>
      )}

      {/* Password Login */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">邮箱</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="pl-10 rounded-xl h-12 bg-card border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">密码</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="pl-10 pr-12 rounded-xl h-12 bg-card border-border"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest">
            {loading ? '登录中...' : '登录'}
          </Button>
          <div className="text-center">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
              忘记密码？
            </Link>
          </div>
        </form>
      )}

      {/* OTP Login - Enter Email */}
      {mode === 'otp' && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">邮箱</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="pl-10 rounded-xl h-12 bg-card border-border"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest">
            {loading ? '发送中...' : '发送验证码'}
          </Button>
        </form>
      )}

      {/* OTP Login - Enter Code */}
      {mode === 'otp_sent' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="space-y-1 mb-6">
            <p className="text-sm font-bold text-foreground">验证码已发送</p>
            <p className="text-xs text-muted-foreground">请查收发送至 <span className="font-bold text-foreground">{email}</span> 的验证码</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">验证码</Label>
            <Input
              type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" required maxLength={6}
              className="rounded-xl h-12 bg-card border-border text-center text-xl font-bold tracking-[0.5em]"
            />
          </div>
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button type="submit" disabled={loading || otp.length < 6}
            className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest">
            {loading ? '验证中...' : '登录'}
          </Button>
          <button type="button" onClick={() => setMode('otp')}
            className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
            重新发送验证码
          </button>
        </form>
      )}

      {/* Register Link */}
      <div className="mt-auto pt-8 text-center">
        <Link to="/register"
          className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          还没有账号？<span className="font-bold text-primary">立即注册</span>
          <ChevronRight size={14} className="text-primary" />
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
