'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, MessageSquare, ListTodo, Zap, Settings, LogOut, Bot,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat',      label: 'Chat',      icon: MessageSquare },
  { href: '/tasks',     label: 'Tasks',     icon: ListTodo },
  { href: '/workflows', label: 'Workflows', icon: Zap },
];

const ADMIN_NAV_ITEM = { href: '/admin', label: 'Admin', icon: Settings };

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = user?.role === 'admin' ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen bg-surface-subtle border-r border-surface-border px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">Autowit</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx('sidebar-item', pathname.startsWith(href) && 'active')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="pt-3 border-t border-surface-border space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs text-white font-medium truncate">{user?.name ?? user?.email}</p>
          <p className="text-xs text-muted truncate">{user?.email}</p>
        </div>
        <button onClick={logout} className="sidebar-item w-full text-left text-red-400 hover:text-red-300">
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
