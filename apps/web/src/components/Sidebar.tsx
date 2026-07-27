'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Plus,
  Ticket,
  Users,
  Tag,
  BarChart3,
  LogOut,
  Headphones,
  ChevronRight,
  Archive,
} from 'lucide-react';

const navItems = {
  COLABORADOR: [
    { href: '/', label: 'Meus Chamados', icon: LayoutDashboard },
    { href: '/tickets/new', label: 'Abrir Chamado', icon: Plus },
  ],
  AGENTE: [
    { href: '/dashboard', label: 'Fila de Chamados', icon: LayoutDashboard },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Fila de Chamados', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/categories', label: 'Categorias', icon: Tag },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  ],
};

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const items = navItems[user.papel] || navItems.COLABORADOR;

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
          <Headphones size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-none">AtendeTI</h1>
          <p className="text-slate-500 text-[10px] mt-0.5">Sistema de Chamados</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0">
            <span className="text-brand-400 text-sm font-semibold">
              {user.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.nome}</p>
            <p className="text-slate-500 text-xs truncate">
              {user.papel === 'COLABORADOR' ? 'Colaborador' : user.papel === 'AGENTE' ? 'Agente TI' : 'Admin'}
              {user.setor ? ` · ${user.setor}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="sidebar-link w-full text-left hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={17} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
