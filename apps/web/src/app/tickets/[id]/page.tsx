'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSocket } from '@/hooks/useSocket';
import { ticketsApi, commentsApi, uploadsApi } from '@/lib/api';
import { Ticket, Comment } from '@/lib/types';
import { colorFromString } from '@/lib/colorFromString';
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
  Image as ImageIcon,
  X,
  Mic,
  Square,
  Play,
  Trash2,
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
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Audio recording state ────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAgent = user?.papel === 'AGENTE' || user?.papel === 'ADMIN';
  const socket = useSocket();

  const [headerY, setHeaderY] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const myTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const timelineItems = useMemo(() => {
    if (!ticket) return [];
    
    const items: Array<any> = [...(ticket.comentarios || [])].map(c => ({ ...c, type: 'comment', date: new Date(c.criadoEm).getTime() }));
    
    if (ticket.atribuidoA && ticket.assumidoEm) {
      items.push({
        type: 'assumido',
        date: new Date(ticket.assumidoEm).getTime(),
        user: ticket.atribuidoA,
      });
    }
    
    return items.sort((a, b) => a.date - b.date);
  }, [ticket]);

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

  useEffect(() => {
    if (!socket || !ticket) return;
    
    const handleCommentCreated = (newComment: Comment) => {
      if (newComment.ticketId === ticket.id) {
        setTicket((prev) => {
          if (!prev) return prev;
          if (prev.comentarios?.some((c) => c.id === newComment.id)) return prev;
          
          return {
            ...prev,
            comentarios: [...(prev.comentarios || []), newComment],
          };
        });
        // Remove typing indicator if user sent comment
        setTypingUsers((prev) => prev.filter(u => u !== newComment.autor.nome));
      }
    };

    const handleUserTyping = (data: { ticketId: string; user: string }) => {
      if (data.ticketId !== ticket.id || data.user === user?.nome) return;
      setTypingUsers((prev) => prev.includes(data.user) ? prev : [...prev, data.user]);
      
      if (typingTimeoutRef.current[data.user]) clearTimeout(typingTimeoutRef.current[data.user]);
      typingTimeoutRef.current[data.user] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter(u => u !== data.user));
      }, 3000);
    };

    socket.on('commentCreated', handleCommentCreated);
    socket.on('ticketTyping', handleUserTyping);

    return () => {
      socket.off('commentCreated', handleCommentCreated);
      socket.off('ticketTyping', handleUserTyping);
    };
  }, [socket, ticket?.id, user?.nome]);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderY(window.scrollY * 0.15); // Parallax factor
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeTab === 'timeline') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.comentarios, activeTab]);

  const handleImageFile = (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
      toast.error('Apenas imagens JPG, PNG, GIF e WebP são permitidas');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAttachedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleImageFile(file);
      }
    }
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAttachedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Audio recording logic ────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Seu navegador não suporta gravação de áudio');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      toast.error('Permissão de microfone negada');
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  }, []);

  const clearAudio = useCallback(() => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
  }, [audioPreviewUrl]);

  const handleSendComment = async () => {
    if (!comment.trim() && !attachedImage && !audioBlob) return;
    setSendingComment(true);
    
    let finalComment = comment;
    
    try {
      // Upload de imagem
      if (attachedImage) {
        const attachment = await uploadsApi.upload(id, attachedImage);
        finalComment = finalComment.trim() 
          ? `${finalComment}\n\n[IMG: ${attachment.url}]`
          : `[IMG: ${attachment.url}]`;
      }

      // Upload de áudio
      if (audioBlob) {
        const ext = audioBlob.type.includes('webm') ? 'webm' : 'ogg';
        const audioFile = new File([audioBlob], `audio-${Date.now()}.${ext}`, { type: audioBlob.type });
        const attachment = await uploadsApi.upload(id, audioFile);
        finalComment = finalComment.trim()
          ? `${finalComment}\n\n[AUDIO: ${attachment.url}]`
          : `[AUDIO: ${attachment.url}]`;
      }
      
      await commentsApi.create(id, { texto: finalComment, isNotaInterna: isInternal });
      setComment('');
      clearImage();
      clearAudio();
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ticketsApi.delete(id);
      toast.success('Chamado apagado com sucesso');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao apagar chamado');
      setDeleting(false);
      setShowDeleteModal(false);
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
    <div className="content-wrapper max-w-7xl animate-fade-in relative">
      {/* Lightbox (#19) */}
      {lightboxImg && (
        <div className="lightbox-backdrop" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={24} />
          </button>
          <img
            src={lightboxImg}
            alt="Anexo Zoom"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Apagar chamado?</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Esta ação é <span className="font-semibold text-red-600">permanente e irreversível</span>.
                  Todo o histórico de comentários e anexos será perdido.
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
              📋 #{ticket?.id.slice(-8).toUpperCase()} — {ticket?.titulo}
            </div>
            <div className="flex gap-3 mt-1">
              <button
                className="flex-1 btn-ghost text-sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Confirmar exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Parallax (#30) */}
      <div 
        className="flex items-start gap-3 mb-6 parallax-header relative z-10"
        style={{ transform: `translateY(${headerY}px)` }}
      >
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
              <div className="p-5 flex flex-col h-full">
                <div className="max-h-[500px] overflow-y-auto scrollbar-thin pr-2 mb-4">
                  {timelineItems.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-8">
                      Nenhuma mensagem ainda. Seja o primeiro a comentar.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {timelineItems.map((item, idx) => (
                        item.type === 'comment' ? (
                          <div key={item.id} className="timeline-item">
                            <CommentItem comment={item} currentUserId={user?.id} onImageClick={setLightboxImg} />
                          </div>
                        ) : (
                          <div key={`assumido-${idx}`} className="flex justify-center my-4">
                            <div className="bg-brand-50 border border-brand-100 text-brand-700 text-xs px-4 py-2 rounded-full font-medium flex items-center gap-2 shadow-sm">
                              <UserCheck size={14} />
                              Chamado assumido por {item.user.nome} em {format(new Date(item.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        )
                      ))}
                      {/* Typing indicator (#18) */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center gap-3 timeline-item">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-[10px] text-slate-400">?</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {typingUsers.length === 1 
                                ? `${typingUsers[0]} está digitando...`
                                : 'Várias pessoas digitando...'}
                            </span>
                            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex gap-1 w-fit">
                              <div className="typing-dot" />
                              <div className="typing-dot" />
                              <div className="typing-dot" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Comment box */}
                {ticket.status !== 'FECHADO' && (
                  <div className="pt-4 border-t border-slate-100 mt-auto">
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
                    
                    {previewUrl && (
                      <div className="relative inline-block mb-3">
                        <img src={previewUrl} alt="Preview" className="h-24 rounded-lg border border-slate-200 shadow-sm" />
                        <button
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-700 shadow-md"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {/* Audio preview before sending */}
                    {audioPreviewUrl && (
                      <div className="flex items-center gap-2 mb-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <audio src={audioPreviewUrl} controls className="h-8 flex-1" />
                        <button
                          onClick={clearAudio}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="flex items-center gap-2 mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 recording-pulse" />
                        <span className="text-sm text-red-700 font-medium">
                          Gravando... {Math.floor(recordingSeconds / 60).toString().padStart(2,'0')}:{(recordingSeconds % 60).toString().padStart(2,'0')}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/gif, image/webp"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageFile(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors shrink-0 self-end"
                        title="Anexar imagem"
                        disabled={isRecording}
                      >
                        <ImageIcon size={18} />
                      </button>
                      {/* Mic button */}
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-xl transition-colors shrink-0 self-end ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                        }`}
                        title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                        disabled={!!audioPreviewUrl}
                      >
                        {isRecording ? <Square size={18} /> : <Mic size={18} />}
                      </button>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onPaste={handlePaste}
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
                          } else {
                            if (socket && user) {
                              socket.emit('ticketTyping', { ticketId: id, user: user.nome });
                            }
                          }
                        }}
                      />
                      <button
                        onClick={handleSendComment}
                        disabled={(!comment.trim() && !attachedImage && !audioBlob) || sendingComment}
                        className={`p-3 rounded-xl transition-all self-end shrink-0 ${
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

          {/* Zona de perigo — apagar ticket (ADMIN only, status RESOLVIDO/FECHADO) */}
          {user?.papel === 'ADMIN' &&
            (ticket.status === 'RESOLVIDO' || ticket.status === 'FECHADO') && (
            <div className="card p-5 border-red-200 bg-red-50/50">
              <h3 className="font-semibold text-red-800 text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={14} />
                Zona de perigo
              </h3>
              <p className="text-xs text-red-600 mb-3">
                Apaga permanentemente este chamado, incluindo todos os comentários, notas internas e anexos.
              </p>
              <button
                id="btn-delete-ticket"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Trash2 size={15} />
                Apagar chamado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, currentUserId, onImageClick }: { comment: Comment; currentUserId?: string, onImageClick?: (url: string) => void }) {
  const isOwn = comment.autor.id === currentUserId;
  const isAgent = comment.autor.papel !== 'COLABORADOR';
  const avatarColor = colorFromString(comment.autor.nome);

  const text = comment.texto || '';
  const imgRegex = /\[IMG:\s*(.+?)\]/g;
  const audioRegex = /\[AUDIO:\s*(.+?)\]/g;
  const textWithoutMedia = text.replace(imgRegex, '').replace(audioRegex, '').trim();
  const images = Array.from(text.matchAll(imgRegex), m => m[1]);
  const audios = Array.from(text.matchAll(audioRegex), m => m[1]);

  const [reactions, setReactions] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const toggleReaction = (emoji: string) => {
    setReactions(prev => ({ ...prev, [emoji]: !prev[emoji] }));
  };

  return (
    <div
      className={`flex gap-3 w-full group ${isOwn ? 'flex-row-reverse' : ''} ${
        comment.isNotaInterna ? 'opacity-80' : ''
      }`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm relative z-10"
        style={{
          backgroundColor: comment.isNotaInterna ? '#fef3c7' : avatarColor.bg,
          color: comment.isNotaInterna ? '#b45309' : avatarColor.text,
          border: `1px solid ${comment.isNotaInterna ? '#fde68a' : avatarColor.border}`
        }}
      >
        {comment.autor.nome.charAt(0)}
      </div>

      <div className={`max-w-[85%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1 relative`}>
        <div className="flex items-center gap-2 flex-wrap px-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{comment.autor.nome}</span>
          {comment.isNotaInterna && (
            <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
              <Lock size={9} />
              Nota interna
            </span>
          )}
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {formatDistanceToNow(new Date(comment.criadoEm), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm relative ${
            comment.isNotaInterna
              ? 'bg-amber-50 border border-amber-200 text-amber-900'
              : isOwn
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-slate-200 text-slate-800'
          }`}
        >
          {textWithoutMedia && <p className="whitespace-pre-wrap">{textWithoutMedia}</p>}
          
          {/* Imagens com Lightbox */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt="Anexo" 
                  className="max-w-full rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity max-h-[200px] object-cover"
                  onClick={() => onImageClick?.(url)}
                />
              ))}
            </div>
          )}

          {/* Audio com Waveform (#16) */}
          {audios.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {audios.map((url, idx) => {
                const isPlaying = playingAudio === url;
                return (
                  <div key={idx} className={`audio-bubble ${isOwn ? 'bg-black/10' : 'bg-slate-100'}`}>
                    <audio
                      src={url}
                      onPlay={() => setPlayingAudio(url)}
                      onPause={() => setPlayingAudio(null)}
                      onEnded={() => setPlayingAudio(null)}
                      controls
                      className="h-8 w-48"
                      style={{ filter: isOwn ? 'invert(1)' : 'none' }}
                    />
                    <div className="flex items-center gap-1 ml-2 h-4 w-12">
                      {[1,2,3,4,5,6,7,8].map(bar => (
                        <div key={bar} className={`waveform-bar ${isPlaying ? 'playing' : ''}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Floating Reactions (#17) */}
          {!comment.isNotaInterna && (
            <div className={`absolute -bottom-3 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 shadow-md rounded-full px-2 py-1 flex items-center gap-1 z-20`}>
              {['👍', '🔥', '👀'].map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className={`reaction-btn ${reactions[emoji] ? 'reacted' : 'grayscale hover:grayscale-0'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
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
