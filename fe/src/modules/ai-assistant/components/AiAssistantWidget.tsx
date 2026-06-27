import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@modules/auth/hooks/useAuth';
import { AIService } from '@core/services/ai/AIService';
import { RAGService } from '@core/services/ai/RAGService';
import { aiLogRepository, aiMemoryRepository } from '@core/db/repositories';
import { AiLogEntry, RagDocument } from '@core/types';
import Badge from '@core/ui/Badge';
import { beaInput } from '@core/ui/beaTheme';
import { MessageSquare, BookOpen, Terminal, Send, Trash2, X, Sparkles, Coins } from 'lucide-react';

export const AiAssistantWidget: React.FC = () => {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'telemetry'>('chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; sources?: string[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AiLogEntry[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [ragQuery, setRagQuery] = useState('');
  const [ragDocs, setRagDocs] = useState<RagDocument[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadChatHistory();
      loadTelemetryLogs();
    }
  }, [user, isOpen, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'knowledge') return;
    void loadKnowledgeDocs(ragQuery);
  }, [isOpen, activeTab]);

  const loadKnowledgeDocs = async (query: string) => {
    try {
      if (!query.trim()) {
        setRagDocs(await RAGService.listAll());
      } else {
        setRagDocs(await RAGService.searchRelevantDocs(query, 5));
      }
    } catch {
      setRagDocs([]);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const history = await aiMemoryRepository.getMemory(user.id);
      if (history.length > 0) {
        setMessages(history.map((h) => ({ role: h.role, text: h.content })));
      } else {
        setMessages([
          {
            role: 'model',
            text: `Halo, ${user.name}! Saya asisten Bea Guru. Tanyakan syarat guru, donasi, atau transparansi program.`,
          },
        ]);
      }
    } catch {
      setMessages([
        {
          role: 'model',
          text: `Halo, ${user.name}! Saya asisten Bea Guru. Tanyakan syarat guru, donasi, atau transparansi program.`,
        },
      ]);
    }
  };

  const loadTelemetryLogs = async () => {
    try {
      const allLogs = await aiLogRepository.getAll();
      const sorted = allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(sorted);
      setTotalTokens(sorted.reduce((sum, l) => sum + l.tokensUsed, 0));
      setTotalCost(Number(sorted.reduce((sum, l) => sum + l.cost, 0).toFixed(6)));
    } catch {
      setLogs([]);
      setTotalTokens(0);
      setTotalCost(0);
    }
  };

  const searchKnowledge = async (query: string) => {
    setRagQuery(query);
    await loadKnowledgeDocs(query);
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !user || loading) return;
    if (!customText) setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);
    try {
      const assistantRes = await AIService.chatWithMemory({
        userId: user.id,
        username: user.email,
        message: textToSend,
        useRag: true,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: assistantRes.text, sources: assistantRes.sourceDocs },
      ]);
      loadTelemetryLogs();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Koneksi terganggu. Pastikan backend aktif lalu coba lagi.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    await aiMemoryRepository.clearMemory(user.id);
    setConfirmClear(false);
    loadChatHistory();
  };

  const promptChips = [
    { label: 'Syarat guru', query: 'Kriteria kelayakan guru honorer' },
    { label: 'Biaya admin?', query: 'Apakah donasi dipotong biaya operasional?' },
    { label: 'Donasi rutin', query: 'Panduan donatur rutin bulanan' },
  ];

  const tabClass = (tab: typeof activeTab) =>
    `flex-1 py-2.5 text-center text-xs font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-bea-copper text-bea-copper bg-white'
        : 'border-transparent text-bea-sage-muted hover:text-bea-ink'
    }`;

  return (
    <div className="ai-fab-root font-sans" aria-live="polite">
      {isOpen && (
        <div id="ai-widget-drawer" className="ai-panel animate-slide-up">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-bea-line bg-bea-copper text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0 text-bea-copper-soft" aria-hidden />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">Asisten Bea Guru</h3>
                <p className="text-[10px] text-white/75 truncate">Pedoman program (RAG)</p>
              </div>
            </div>
            <button
              type="button"
              id="ai-widget-toggle-close"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              aria-label="Tutup asisten"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex border-b border-bea-line bg-bea-ivory-light shrink-0">
            <button type="button" onClick={() => setActiveTab('chat')} className={tabClass('chat')}>
              <MessageSquare size={13} className="inline mr-1 -mt-0.5" />
              Chat
            </button>
            <button type="button" onClick={() => setActiveTab('knowledge')} className={tabClass('knowledge')}>
              <BookOpen size={13} className="inline mr-1 -mt-0.5" />
              Pedoman
            </button>
            <button type="button" onClick={() => setActiveTab('telemetry')} className={tabClass('telemetry')}>
              <Terminal size={13} className="inline mr-1 -mt-0.5" />
              Log
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden bg-bea-ivory">
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm scrollbar-thin">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[88%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed border ${
                          msg.role === 'user'
                            ? 'bg-bea-copper text-white border-bea-copper-dark rounded-br-md'
                            : 'bg-white text-bea-ink border-bea-line rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-bea-line/50 text-[10px] text-bea-sage-muted">
                            <span className="font-medium block mb-1">Sumber:</span>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-bea-ivory-light border border-bea-line"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-1.5 px-3 py-2 rounded-2xl bg-white border border-bea-line w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-bea-copper animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-bea-copper animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-bea-copper animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {messages.length <= 2 && !loading && (
                  <div className="px-3 pb-2 space-y-1.5">
                    {promptChips.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleSendMessage(undefined, chip.query)}
                        className="w-full text-left text-xs px-3 py-2 rounded-xl border border-bea-line bg-white text-bea-copper-dark hover:border-bea-copper transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {confirmClear && (
                  <div className="portal-form-notice portal-form-notice--warning mx-3 mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium">Hapus memori percakapan?</span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-bea-sage"
                        onClick={() => setConfirmClear(false)}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-bea-copper-dark"
                        onClick={() => void handleClearHistory()}
                      >
                        Ya, hapus
                      </button>
                    </span>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-bea-line bg-white flex items-center gap-2 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    title="Bersihkan chat"
                    className="p-2 rounded-lg text-bea-sage-muted hover:text-bea-copper-dark hover:bg-bea-ivory"
                  >
                    <Trash2 size={16} />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Tanya donasi, syarat guru…"
                    className={`${beaInput} flex-1 py-2 text-xs`}
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputText.trim()}
                    className="p-2.5 rounded-xl bg-bea-copper hover:bg-bea-copper-dark disabled:opacity-40 text-white transition-colors"
                    aria-label="Kirim"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div className="p-3 h-full flex flex-col gap-2">
                <input
                  type="search"
                  value={ragQuery}
                  onChange={(e) => searchKnowledge(e.target.value)}
                  placeholder="Cari pedoman…"
                  className={`${beaInput} text-xs py-2`}
                />
                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                  {ragDocs.length > 0 ? (
                    ragDocs.map((doc) => (
                      <article
                        key={doc.id}
                        className="p-3 rounded-xl border border-bea-line bg-white"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-serif font-semibold text-xs text-bea-copper">
                            {doc.title}
                          </h4>
                          <Badge variant="neutral" className="text-[9px] shrink-0">
                            {doc.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-bea-sage leading-relaxed whitespace-pre-wrap">
                          {doc.content}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-center text-xs text-bea-sage-muted py-8">Dokumen tidak ditemukan.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'telemetry' && (
              <div className="p-3 h-full flex flex-col gap-3 overflow-hidden">
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <div className="p-3 rounded-xl border border-bea-line bg-white text-center">
                    <p className="text-[10px] font-medium text-bea-sage-muted flex items-center justify-center gap-1">
                      <Coins size={12} className="text-bea-copper" />
                      Token
                    </p>
                    <p className="font-serif text-lg font-semibold text-bea-ink tabular-nums">
                      {totalTokens.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-bea-line bg-white text-center">
                    <p className="text-[10px] font-medium text-bea-sage-muted">Estimasi</p>
                    <p className="font-serif text-lg font-semibold text-bea-copper tabular-nums">
                      ${totalCost.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-bea-line bg-white overflow-hidden">
                  <div className="px-3 py-2 border-b border-bea-line text-[10px] font-semibold text-bea-sage-muted uppercase">
                    {logs.length} panggilan
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-bea-line text-xs scrollbar-thin">
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <div key={log.id} className="px-3 py-2">
                          <div className="flex justify-between gap-2">
                            <span className="font-medium truncate">{log.username}</span>
                            <span className="text-bea-sage-muted shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-bea-sage-muted mt-0.5">
                            {log.tokensUsed} token · ${log.cost.toFixed(4)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-bea-sage-muted py-10 text-xs">Belum ada log.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          id="ai-widget-toggle-open"
          onClick={() => setIsOpen(true)}
          className="ai-fab-btn"
          aria-label="Buka asisten AI"
          title="Tanya AI"
        >
          <Sparkles size={22} />
        </button>
      )}
    </div>
  );
};
