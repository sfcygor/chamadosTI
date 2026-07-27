'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { usersApi } from '@/lib/api';
import { Role, ROLE_LABELS } from '@/lib/types';
import { UserPlus, Edit2, User, Shield, Headphones, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';

const ROLE_ICONS: Record<Role, any> = {
  COLABORADOR: User,
  AGENTE: Headphones,
  ADMIN: Shield,
};

const ROLE_COLORS: Record<Role, string> = {
  COLABORADOR: 'bg-slate-100 text-slate-700',
  AGENTE: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-brand-100 text-brand-700',
};

export default function AdminUsersPage() {
  return (
    <AppLayout>
      <UsersAdmin />
    </AppLayout>
  );
}

function UsersAdmin() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    papel: 'COLABORADOR' as Role,
    setor: '',
  });

  const load = () => {
    usersApi.list().then((us) => {
      setUsers(us);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          nome: form.nome,
          papel: form.papel,
          setor: form.setor,
          ...(form.senha ? { senha: form.senha } : {}),
        });
        toast.success('Usuário atualizado!');
      } else {
        await usersApi.create(form);
        toast.success('Usuário criado!');
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({ nome: '', email: '', senha: '', papel: 'COLABORADOR', setor: '' });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (u: any) => {
    setEditingUser(u);
    setForm({ nome: u.nome, email: u.email, senha: '', papel: u.papel, setor: u.setor || '' });
    setShowForm(true);
  };

  const handleToggleActive = async (u: any) => {
    try {
      await usersApi.update(u.id, { ativo: !u.ativo });
      toast.success(u.ativo ? 'Usuário desativado' : 'Usuário reativado');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="content-wrapper max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gerencie colaboradores, agentes e administradores
          </p>
        </div>
        <button
          id="btn-new-user"
          onClick={() => {
            setShowForm(!showForm);
            setEditingUser(null);
            setForm({ nome: '', email: '', senha: '', papel: 'COLABORADOR', setor: '' });
          }}
          className="btn-primary"
        >
          <UserPlus size={16} />
          Novo usuário
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-6 border border-brand-200 animate-slide-up">
          <h2 className="font-semibold text-slate-900 mb-4">
            {editingUser ? 'Editar usuário' : 'Novo usuário'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nome completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="input-label">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={!!editingUser}
                className="input"
              />
            </div>
            <div>
              <label className="input-label">
                {editingUser ? 'Nova senha (deixe vazio para manter)' : 'Senha'}
              </label>
              <input
                type="password"
                value={form.senha}
                onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                className="input"
                placeholder={editingUser ? '••••••••' : ''}
              />
            </div>
            <div>
              <label className="input-label">Setor</label>
              <input
                type="text"
                value={form.setor}
                onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))}
                placeholder="Ex: Financeiro, RH, Comercial..."
                className="input"
              />
            </div>
            <div>
              <label className="input-label">Papel</label>
              <select
                value={form.papel}
                onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value as Role }))}
                className="select"
              >
                <option value="COLABORADOR">Colaborador</option>
                <option value="AGENTE">Agente TI</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="btn-primary gap-2">
              <Check size={16} />
              {editingUser ? 'Salvar alterações' : 'Criar usuário'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingUser(null); }}
              className="btn-secondary gap-2"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                  Usuário
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                  Papel
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                  Setor
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                  Chamados
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                  Status
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.papel as Role];
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50 transition-colors ${!u.ativo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-brand-700 text-sm font-bold">
                              {u.nome.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{u.nome}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[u.papel as Role]}`}>
                          <RoleIcon size={11} />
                          {ROLE_LABELS[u.papel as Role]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">{u.setor || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-500">
                          {u._count?.ticketsCriados || 0} criados
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(u)}
                            className="btn-ghost p-2 text-slate-500 hover:text-brand-600"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`btn-ghost p-2 ${
                              u.ativo ? 'text-slate-500 hover:text-red-600' : 'text-slate-500 hover:text-green-600'
                            }`}
                            title={u.ativo ? 'Desativar' : 'Reativar'}
                          >
                            {u.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
