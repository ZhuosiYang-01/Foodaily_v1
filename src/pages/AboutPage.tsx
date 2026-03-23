import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Heart, Coffee } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-24 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <Info size={16} className="text-primary" /> 关于产品
        </h2>
        <div className="w-10" />
      </header>

      <div className="p-8 space-y-12">
        {/* App Info */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-lg shadow-primary/10">
            <Coffee size={48} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold serif text-gray-900">Foodaily</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">v1.0.0 (结构版)</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 产品定位
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed italic">
              这是一款手机优先、以个人使用为核心的美食记录型 Web App，帮助用户把自己做过的菜品、烘焙和饮品整理成一个可持续积累、便于回看、也适合展示的个人下厨档案。
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 核心理念
            </h3>
            <ul className="space-y-4">
              {[
                { title: '做饭下厨记录', desc: '记录每一次做过的菜品、烘焙或饮品，保存照片、评价和备忘。' },
                { title: '记录归纳与回看', desc: '将多次制作归档到同一个作品下，直观看到自己的厨艺进步。' },
                { title: '日历回顾', desc: '以日历的方式查看自己的每日记录，用时间视角回顾下厨生活。' },
                { title: '情绪化陪伴', desc: '通过轻量、俏皮的文案鼓励记录和回顾，让产品不仅是工具。' },
              ].map((item, idx) => (
                <li key={idx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                  <h4 className="text-xs font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-8 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
            Made with <Heart size={10} className="text-red-400 fill-red-400" /> for food lovers
          </p>
          <p className="text-[10px] text-gray-400">© 2026 Foodaily Team. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
