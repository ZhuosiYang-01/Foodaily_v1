import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'email' | 'reset';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStep('reset');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('密码至少需要 8 位'); return; }
    if (newPassword !== confirmPassword) { setError('两次输入的密码不一致'); return; }

    setLoading(true);
    // First verify OTP to get a session
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });

    if (otpError) {
      setLoading(false);
      setError('验证码错误或已过期');
      return;
    }

    // Then update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-12 pb-8">
      <div className="flex items-center mb-10">
        <button onClick={() => step === 'reset' ? setStep('email') : navigate('/login')}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest ml-2">重置密码</h2>
      </div>

      {step === 'email' && (
        <form onSubmit={handleSendReset} className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed -mt-4 mb-2">
            输入你注册时使用的邮箱，我们将发送验证码帮助你重置密码。
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
          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          <Button type="submit" disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest">
            {loading ? '发送中...' : '发送验证码'}
          </Button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-1 -mt-4 mb-2">
            <p className="text-sm font-bold text-foreground">验证码已发送</p>
            <p className="text-xs text-muted-foreground">请查收 {email} 的邮件，输入验证码并设置新密码。</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">验证码</Label>
            <Input
              type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" required maxLength={6}
              className="rounded-xl h-12 bg-card border-border text-center text-xl font-bold tracking-[0.5em]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">新密码</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
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
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">确认新密码</Label>
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

          <Button type="submit" disabled={loading || otp.length < 6}
            className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest">
            {loading ? '重置中...' : '重置密码'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
