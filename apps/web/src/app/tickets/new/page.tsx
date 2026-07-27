'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { ticketsApi, categoriesApi } from '@/lib/api';
import { Category } from '@/lib/types';
import { ArrowLeft, Paperclip, X, Info, Upload, ChevronDown } from 'lucide-react';



export default function NewTicketPage() {
  return (
    <AppLayout>
      <NewTicketForm />
    </AppLayout>
  );
}

function NewTicketForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoriaId: '',
  });

  useEffect(() => {
    categoriesApi.list().then(setCategories);
  }, []);



  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.descricao || !form.categoriaId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const ticket = await ticketsApi.create(form);
      toast.success('Chamado aberto com sucesso!');
      router.push(`/tickets/${ticket.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir chamado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="btn-ghost p-2"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Abrir chamado</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Preencha as informações abaixo para solicitar suporte à TI.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Categoria */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            Qual é o tipo do problema?
          </h2>
          <div className="relative">
            <select
              id="categoria"
              value={form.categoriaId}
              onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
              required
              className="select pr-10"
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>


        </div>

        {/* Assunto + Descrição */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            Descreva o problema
          </h2>

          <div>
            <label htmlFor="titulo" className="input-label">
              Assunto <span className="text-red-500">*</span>
            </label>
            <input
              id="titulo"
              type="text"
              placeholder="Ex: Computador não liga, Internet lenta, Não consigo acessar o sistema..."
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              required
              maxLength={120}
              className="input"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {form.titulo.length}/120
            </p>
          </div>

          <div>
            <label htmlFor="descricao" className="input-label">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descricao"
              placeholder="Descreva em detalhes o que está acontecendo. Quando começou? O que você já tentou? Isso ajuda a TI a resolver mais rápido."
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              required
              rows={5}
              className="textarea"
            />
          </div>
        </div>

        {/* Anexos */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            Anexar arquivos{' '}
            <span className="text-xs font-normal text-slate-400">(opcional)</span>
          </h2>

          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all group"
          >
            <Upload size={20} className="text-slate-400 group-hover:text-brand-500 mb-2" />
            <p className="text-sm text-slate-500 group-hover:text-brand-600">
              Clique para anexar ou arraste arquivos
            </p>
            <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, PDF até 10MB (máx. 5)</p>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFile}
            />
          </label>

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2"
                >
                  <Paperclip size={14} className="text-slate-400 shrink-0" />
                  <span className="flex-1 truncate text-slate-700">{file.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            id="btn-submit-ticket"
            type="submit"
            disabled={loading}
            className="btn-primary flex-[2]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Abrir chamado'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
