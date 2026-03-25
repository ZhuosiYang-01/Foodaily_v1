import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Heart } from 'lucide-react';

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
          <Info size={16} className="text-primary" /> 关于产品
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-8 space-y-12">
        {/* App Info */}
        <div className="text-center space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold serif text-foreground">Foodaily</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">V0 测试版</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 产品定位
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed serif">
              这是一款手机优先、以个人使用为核心的美食记录型 Web App，帮助用户把自己做过的菜品、烘焙和饮品整理成一个可持续积累、便于回看、也适合展示的个人下厨档案。
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 核心功能
            </h3>
            <ul className="space-y-4">
              {[
                { title: '做饭下厨记录', desc: '记录每一次做过的菜品、烘焙或饮品，保存照片、评价和备忘。' },
                { title: '记录归纳与回看', desc: '将多次制作归档到同一个作品下，直观看到自己的厨艺进步。' },
                { title: '日历回顾', desc: '以日历的方式查看自己的每日记录，用时间视角回顾下厨生活。' },
                { title: '情绪化陪伴', desc: '通过轻量、俏皮的文案鼓励记录和回顾，让产品不仅是工具。' },
              ].map((item, idx) => (
                <li key={idx} className="bg-card p-4 rounded-2xl border border-border">
                  <h4 className="text-xs font-bold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-8 border-t border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5">
            Made with <Heart size={10} className="text-red-400 fill-red-400" /> for food lovers
          </p>
          <p className="text-[10px] text-muted-foreground">© 2026 Foodaily Team. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
