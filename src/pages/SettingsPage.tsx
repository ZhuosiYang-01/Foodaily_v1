import React from 'react';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import { ChevronLeft, LayoutGrid, Info, User, Layers } from 'lucide-react';

const settingsItems = [
  { to: '/account', icon: User, label: '我的账号', color: 'text-purple-500 bg-purple-50' },
  { to: '/settings/categories', icon: LayoutGrid, label: '分类设置', color: 'text-blue-500 bg-blue-50' },
  { to: '/batch-import', icon: Layers, label: '批量导入记录', color: 'text-orange-500 bg-orange-50' },
  { to: '/about', icon: Info, label: '关于 Foodaily', color: 'text-gray-500 bg-gray-50' },
];

const SettingsPage = () => {
  return (
    <div className="pb-24 pt-6 px-4 space-y-8 animate-in fade-in duration-500 min-h-screen bg-background">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User size={24} className="text-primary" /> 设置
        </h1>
      </header>

      <div className="space-y-4">
        {settingsItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={item.to === '/batch-import' ? () => posthog.capture('add_mode_selected', { mode: 'batch', from: 'settings' }) : undefined}
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
        ))}
      </div>

      <footer className="text-center pt-8">
        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Foodaily Version 1.0</p>
      </footer>
    </div>
  );
};

export default SettingsPage;
