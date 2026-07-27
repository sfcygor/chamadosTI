'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Headphones, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return;

    setLoading(true);
    try {
      await login(email, senha);
      toast.success('Bem-vindo(a) ao AtendeTI!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Credenciais inválidas. Verifique e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const users: Record<string, [string, string]> = {
      admin: ['admin@atendeti.com', 'Admin@123'],
      agente: ['carlos.ti@atendeti.com', 'Admin@123'],
      colaborador: ['joao.silva@atendeti.com', 'Admin@123'],
    };
    const [e, s] = users[role];
    setEmail(e);
    setSenha(s);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-xl shadow-brand-900/50 mb-4">
            <Headphones size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AtendeTI</h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Sistema de Gestão de Chamados de TI
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-brand-900/40"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500 text-center mb-3 font-medium uppercase tracking-wide">
              Contas de demonstração
            </p>
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
              {[
                { role: 'colaborador', label: 'Colaborador', color: 'border-slate-400/30 hover:border-slate-400/60 text-slate-300' },
                { role: 'agente', label: 'Agente TI', color: 'border-blue-400/30 hover:border-blue-400/60 text-blue-300' },
                { role: 'admin', label: 'Admin', color: 'border-brand-400/30 hover:border-brand-400/60 text-brand-300' },
              ].map(({ role, label, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className={`text-xs py-1.5 rounded-lg border bg-white/5 font-medium transition-all ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 text-center mt-2">
              Senha: Admin@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
