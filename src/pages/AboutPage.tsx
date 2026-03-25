import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Info size={16} className="text-primary" /> 关于 Foodaily
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-8 space-y-12">
        {/* App Info */}
        <div className="text-center space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold serif text-foreground">Foodaily</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Version 1.0</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed serif">
              Foodaily 是你的私人厨房日记。在这里，你可以轻松记录每一次下厨的闪光时刻——无论是第一次尝试烘焙的惊喜，还是复刻妈妈拿手菜的温暖。Foodaily 希望帮你把散落在手机相册里的美食记忆，整理成一本专属于你的、充满成就感的“个人作品集”。
            </p>
          </section>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
