import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'form' | 'verify';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('密码至少需要 8 位'); return; }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      const msg = error.message || error.code || '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('该邮箱已注册，请直接登录');
      } else if ((error as any).status === 504) {
        setError('服务器超时，请稍后重试');
      } else {
        setError(msg || '注册失败，请重试');
      }
    } else if (data.session) {
      // Email confirmation disabled: user is logged in immediately
      navigate('/', { replace: true });
    } else {
      // Email confirmation enabled: need OTP
      setStep('verify');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
    setLoading(false);
    if (error) {
      setError('验证码错误或已过期');
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center mb-10">
        <button onClick={() => step === 'verify' ? setStep('form') : navigate('/login')}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest ml-2">
          {step === 'form' ? '创建账号' : '验证邮箱'}
        </h2>
      </div>

      {/* Step 1: Fill in details */}
      {step === 'form' && (
        <form onSubmit={handleRegister} className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed -mt-4 mb-2">
            注册后即可在多台设备上同步你的 Foodaily 数据。
          </p>

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
                placeholder="至少 8 位" required
                className="pl-10 pr-12 rounded-xl h-12 bg-card border-border"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">确认密码</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再输入一次" required
                className="pl-10 rounded-xl h-12 bg-card border-border"
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest">
            {loading ? '处理中...' : '发送验证码'}
          </Button>
        </form>
      )}

      {/* Step 2: Verify OTP */}
      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-1 -mt-4 mb-2">
            <p className="text-sm font-bold text-foreground">验证码已发送至</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            <p className="text-xs text-muted-foreground mt-2">请查收邮件并输入 6 位验证码以完成注册。</p>
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
            {loading ? '验证中...' : '完成注册'}
          </Button>
          <button type="button" onClick={() => handleRegister({ preventDefault: () => {} } as any)}
            className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
            没收到？重新发送
          </button>
        </form>
      )}

      <div className="mt-auto pt-8 text-center">
        <Link to="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
          已有账号？<span className="font-bold text-primary">立即登录</span>
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
