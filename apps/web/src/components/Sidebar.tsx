'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  Sun,
  Moon,
  Activity,
  Sparkles,
} from 'lucide-react';
import { AuroraText } from '@/components/AuroraText';

const navItems = {
  COLABORADOR: [
    { href: '/', label: 'Meus Chamados', icon: LayoutDashboard },
    { href: '/tickets/new', label: 'Abrir Chamado', icon: Plus },
  ],
  AGENTE: [
    { href: '/dashboard', label: 'Fila de Chamados', icon: LayoutDashboard },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/preview', label: 'Novo Design ✨', icon: Sparkles },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'Fila de Chamados', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/categories', label: 'Categorias', icon: Tag },
    { href: '/admin/audit', label: 'Auditoria', icon: Activity },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/preview', label: 'Novo Design ✨', icon: Sparkles },
  ],
};

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (!user) return null;

  const items = navItems[user.papel] || navItems.COLABORADOR;

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/icons/atendeti.png" alt="Logo AtendeTI" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col -mt-1 overflow-hidden h-[40px] justify-center relative w-full">
          <div style={{ transform: 'scale(0.25)', transformOrigin: 'left center', width: 'max-content', position: 'absolute' }}>
            <AuroraText
              text="AtendeTI"
              font={{
                fontFamily: "Fira Sans",
                fontWeight: 800,
                fontSize: "90px",
                lineHeight: "1em",
                letterSpacing: "0em",
                textAlign: "center"
              }}
              colors={["#A6B7A8", "#1EB73A"]}
              direction="alternate"
              speed={5}
              angle={135}
            />
          </div>
          <p className="text-slate-500 text-[10px] mt-[22px] relative z-10">Sistema de Chamados</p>
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

      {/* Theme toggle + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button
          onClick={toggleTheme}
          className="sidebar-link w-full text-left"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
        </button>
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
