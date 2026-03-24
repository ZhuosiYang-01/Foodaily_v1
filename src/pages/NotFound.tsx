import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Coffee, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in duration-500">
      <div className="w-32 h-32 bg-card rounded-[3rem] flex items-center justify-center text-muted-foreground/20 shadow-inner border border-border/50">
        <Coffee size={64} />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold serif text-foreground">404</h1>
        <p className="text-sm text-muted-foreground italic">哎呀，这个页面好像被吃掉了 ✨</p>
      </div>
      <Button 
        onClick={() => navigate('/')}
        className="rounded-2xl h-12 px-8 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
      >
        <ArrowLeft size={16} className="mr-2" /> 回到首页
      </Button>
    </div>
  );
};

export default NotFound;
