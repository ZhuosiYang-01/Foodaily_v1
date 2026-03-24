import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, PlusCircle, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/categories', icon: LayoutGrid, label: '分类' },
    { to: '/new-record', icon: PlusCircle, label: '新增', isMain: true },
    { to: '/calendar', icon: Calendar, label: '日历' },
    { to: '/settings', icon: User, label: '设置' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border/50 flex items-center justify-around h-16 px-2 z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center transition-colors",
              item.isMain ? "text-primary -mt-8 bg-card rounded-full p-1 shadow-lg" : (isActive ? "text-primary" : "text-muted-foreground")
            )
          }
        >
          {item.isMain ? (
            <div className="bg-primary text-white rounded-full p-3 shadow-md active:scale-95 transition-transform">
              <item.icon size={28} />
            </div>
          ) : (
            <>
              <item.icon size={22} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
