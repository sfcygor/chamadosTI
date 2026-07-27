'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { categoriesApi } from '@/lib/api';
import { Category, Priority } from '@/lib/types';
import { PriorityBadge } from '@/components/PriorityBadge';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

export default function AdminCategoriesPage() {
  return (
    <AppLayout>
      <CategoriesAdmin />
    </AppLayout>
  );
}

function CategoriesAdmin() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '',
    slaHoras: 24,
  });

  const load = () => {
    categoriesApi.listAdmin().then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editingId) {
        await categoriesApi.update(editingId, form);
        toast.success('Categoria atualizada!');
      } else {
        await categoriesApi.create(form);
        toast.success('Categoria criada!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ nome: '', slaHoras: 24 });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({ nome: cat.nome, slaHoras: cat.slaHoras });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Desativar esta categoria?')) return;
    try {
      await categoriesApi.delete(id);
      toast.success('Categoria desativada');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="content-wrapper max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Configure categorias e SLAs de atendimento
          </p>
        </div>
        <button
          id="btn-new-category"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ nome: '', slaHoras: 24 });
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          Nova categoria
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-6 border border-brand-200 animate-slide-up">
          <h2 className="font-semibold text-slate-900 mb-4">
            {editingId ? 'Editar categoria' : 'Nova categoria'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Hardware"
                className="input"
              />
            </div>

            <div>
              <label className="input-label">SLA (horas)</label>
              <input
                type="number"
                value={form.slaHoras}
                onChange={(e) => setForm((f) => ({ ...f, slaHoras: parseInt(e.target.value) }))}
                min={1}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="btn-primary gap-2">
              <Check size={16} />
              {editingId ? 'Salvar alterações' : 'Criar categoria'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="btn-secondary gap-2"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                Categoria
              </th>

              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                SLA
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5">
                Chamados
              </th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                  Carregando...
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-900 text-sm">{cat.nome}</span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-700">{cat.slaHoras}h</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-500">
                      {cat._count?.tickets || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="btn-ghost p-2 text-slate-500 hover:text-brand-600"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="btn-ghost p-2 text-slate-500 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
