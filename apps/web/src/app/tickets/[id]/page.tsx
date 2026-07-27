'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ticketsApi, commentsApi } from '@/lib/api';
import { Ticket, Comment } from '@/lib/types';
import {
  ArrowLeft,
  Send,
  Lock,
  Paperclip,
  Star,
  UserCheck,
  ChevronDown,
  History,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TicketDetailPage() {
  return (
    <AppLayout>
      <TicketDetail />
    </AppLayout>
  );
}

function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'history'>('timeline');

  const isAgent = user?.papel === 'AGENTE' || user?.papel === 'ADMIN';

  const load = () => {
    ticketsApi.get(id).then((t) => {
      setTicket(t);
      setLoading(false);
    }).catch(() => {
      toast.error('Chamado não encontrado');
      router.push('/');
    });
  };

  useEffect(() => { load(); }, [id]);

  const handleSendComment = async () => {
    if (!comment.trim()) return;
    setSendingComment(true);
    try {
      await commentsApi.create(id, { texto: comment, isNotaInterna: isInternal });
      setComment('');
      toast.success(isInternal ? 'Nota interna adicionada' : 'Comentário enviado');
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSendingComment(false);
    }
  };

  const handleAssume = async () => {
    try {
      await ticketsApi.assume(id);
      toast.success('Chamado assumido!');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await ticketsApi.update(id, { status: newStatus });
      toast.success('Status atualizado');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };



  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!ticket) return null;


  return (
    <div className="content-wrapper max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => router.back()} className="btn-ghost p-2 mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.prioridade} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-snug">
            {ticket.titulo}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            #{ticket.id.slice(-8).toUpperCase()} ·{' '}
            {ticket.categoria.nome} ·{' '}
            Aberto por {ticket.criadoPor.nome}
            {ticket.criadoPor.setor ? ` (${ticket.criadoPor.setor})` : ''} ·{' '}
            {formatDistanceToNow(new Date(ticket.criadoEm), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Descrição
            </h2>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {ticket.descricao}
            </p>

            {ticket.anexos && ticket.anexos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Anexos</p>
                <div className="flex flex-wrap gap-2">
                  {ticket.anexos.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Paperclip size={12} />
                      {a.nomeArquivo}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Solução */}
          {ticket.descricaoSolucao && (
            <div className="card p-5 border-l-4 border-green-500">
              <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">
                ✓ Solução aplicada
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed">
                {ticket.descricaoSolucao}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="card overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-thin border-b border-slate-100">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === 'timeline'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare size={15} />
                Conversação
                {ticket.comentarios && (
                  <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                    {ticket.comentarios.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-brand-600 border-b-2 border-brand-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <History size={15} />
                Histórico de prioridade
              </button>
            </div>

            {/* Timeline */}
            {activeTab === 'timeline' && (
              <div className="p-5">
                {(!ticket.comentarios || ticket.comentarios.length === 0) ? (
                  <p className="text-center text-slate-400 text-sm py-8">
                    Nenhuma mensagem ainda. Seja o primeiro a comentar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {ticket.comentarios.map((c) => (
                      <CommentItem key={c.id} comment={c} currentUserId={user?.id} />
                    ))}
                  </div>
                )}

                {/* Comment box */}
                {ticket.status !== 'FECHADO' && (
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    {isAgent && (
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setIsInternal(false)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            !isInternal
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <MessageSquare size={12} />
                          Resposta pública
                        </button>
                        <button
                          onClick={() => setIsInternal(true)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            isInternal
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Lock size={12} />
                          Nota interna
                        </button>
                      </div>
                    )}
                    {isInternal && (
                      <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                        <Lock size={12} />
                        Nota interna — visível apenas para a equipe de TI
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={
                          isInternal
                            ? 'Adicionar nota interna da equipe...'
                            : 'Escrever uma mensagem...'
                        }
                        rows={3}
                        className="input resize-none flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleSendComment();
                          }
                        }}
                      />
                      <button
                        onClick={handleSendComment}
                        disabled={!comment.trim() || sendingComment}
                        className={`p-3 rounded-xl transition-all self-end ${
                          isInternal
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'btn-primary'
                        } disabled:opacity-50`}
                      >
                        {sendingComment ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Ctrl+Enter para enviar
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Priority history */}
            {activeTab === 'history' && (
              <div className="p-5">
                {(!ticket.priorityLogs || ticket.priorityLogs.length === 0) ? (
                  <p className="text-center text-slate-400 text-sm py-8">
                    Nenhuma alteração de prioridade registrada.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ticket.priorityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                          <History size={14} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-slate-700">
                            <span className="font-medium">{log.alteradoPor.nome}</span>{' '}
                            alterou de{' '}
                            <span className="font-semibold">{log.prioridadeAnterior}</span> →{' '}
                            <span className="font-semibold">{log.novaPrioridade}</span>
                          </p>
                          {log.motivo && (
                            <p className="text-slate-500 text-xs mt-0.5">{log.motivo}</p>
                          )}
                          <p className="text-slate-400 text-xs mt-0.5">
                            {format(new Date(log.criadoEm), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>


        </div>

        {/* Sidebar info + actions */}
        <div className="space-y-5">
          {/* Agent actions */}
          {isAgent && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-slate-900 text-sm">Ações</h3>

              {ticket.atribuidoA?.id !== user?.id && ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO' && (
                <button
                  id="btn-assume"
                  onClick={handleAssume}
                  className="btn-primary w-full mb-2"
                >
                  <UserCheck size={16} />
                  Assumir chamado
                </button>
              )}

              {ticket.prioridade === 'NAO_CLASSIFICADA' && (
                <div className="rounded bg-amber-50 border border-amber-200 p-2 mb-2 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-tight">
                    Classifique a prioridade para iniciar o controle de SLA.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="input-label text-xs">Prioridade</label>
                  <select
                    value={ticket.prioridade}
                    onChange={(e) => {
                      ticketsApi.update(id, { prioridade: e.target.value })
                        .then(() => { toast.success('Prioridade atualizada'); load(); })
                        .catch((err) => toast.error(err.message));
                    }}
                    className="select text-xs"
                  >
                    <option value="NAO_CLASSIFICADA">Não classificada</option>
                    <option value="CRITICA">Crítica</option>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="input-label text-xs">Alterar status</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="select text-xs"
                  >
                    <option value="NOVO">Novo</option>
                    <option value="EM_ANDAMENTO">Em andamento</option>
                    <option value="AGUARDANDO_USUARIO">Aguardando usuário</option>
                    <option value="RESOLVIDO">Resolvido</option>
                    <option value="FECHADO">Fechado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm">Detalhes</h3>
            <InfoRow label="Categoria" value={ticket.categoria.nome} />
            <InfoRow label="SLA" value={`${ticket.categoria.slaHoras}h`} />
            <InfoRow label="Abertura" value={format(new Date(ticket.criadoEm), "dd/MM/yyyy 'às' HH:mm")} />
            {ticket.atribuidoA && (
              <InfoRow label="Responsável" value={ticket.atribuidoA.nome} />
            )}
            {ticket.resolvidoEm && (
              <InfoRow
                label="Resolvido em"
                value={format(new Date(ticket.resolvidoEm), "dd/MM/yyyy 'às' HH:mm")}
              />
            )}
            <InfoRow
              label="Última atualização"
              value={formatDistanceToNow(new Date(ticket.atualizadoEm), {
                addSuffix: true,
                locale: ptBR,
              })}
            />
          </div>

          {/* SLA alert */}
          {isAgent && ticket.status !== 'RESOLVIDO' && ticket.status !== 'FECHADO' && (
            <SlaIndicator ticket={ticket} />
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, currentUserId }: { comment: Comment; currentUserId?: string }) {
  const isOwn = comment.autor.id === currentUserId;
  const isAgent = comment.autor.papel !== 'COLABORADOR';

  return (
    <div
      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} ${
        comment.isNotaInterna ? 'opacity-80' : ''
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
          comment.isNotaInterna
            ? 'bg-amber-100 text-amber-700'
            : isAgent
            ? 'bg-brand-100 text-brand-700'
            : 'bg-slate-100 text-slate-700'
        }`}
      >
        {comment.autor.nome.charAt(0)}
      </div>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-700">{comment.autor.nome}</span>
          {comment.isNotaInterna && (
            <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
              <Lock size={9} />
              Nota interna
            </span>
          )}
          <span className="text-[10px] text-slate-400">
            {formatDistanceToNow(new Date(comment.criadoEm), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            comment.isNotaInterna
              ? 'bg-amber-50 border border-amber-200 text-amber-900'
              : isOwn
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-800'
          }`}
        >
          <p className="whitespace-pre-wrap">{comment.texto}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function SlaIndicator({ ticket }: { ticket: Ticket }) {
  const horasPassadas = Math.floor(
    (Date.now() - new Date(ticket.criadoEm).getTime()) / (1000 * 60 * 60),
  );
  const slaHoras = ticket.categoria.slaHoras;
  const percentual = Math.min((horasPassadas / slaHoras) * 100, 100);
  const estourado = horasPassadas >= slaHoras;

  return (
    <div className={`card p-4 ${estourado ? 'border border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-600">SLA</span>
        {estourado && (
          <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
            <AlertTriangle size={12} />
            Estourado
          </span>
        )}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all ${
            percentual >= 100
              ? 'bg-red-500'
              : percentual >= 75
              ? 'bg-amber-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {horasPassadas}h de {slaHoras}h
      </p>
    </div>
  );
}
