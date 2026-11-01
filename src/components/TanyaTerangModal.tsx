import React, { useState, useRef, useEffect } from 'react';
import { Send, X, User, ThumbsUp, ThumbsDown, ArrowRight, MessageSquare, Building2, Copy, Check } from 'lucide-react';

interface TanyaTerangModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  toolUsed?: string;
  driver?: 'gemini' | 'fallback';
  dataLinks?: string;
  timestamp: string;
}

const TypewriterText: React.FC<{ fullText: string; isLatest: boolean }> = ({ fullText, isLatest }) => {
  const [displayedText, setDisplayedText] = useState(isLatest ? '' : fullText);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(fullText);
      return;
    }
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      i += 4;
      if (i >= fullText.length) {
        setDisplayedText(fullText);
        clearInterval(timer);
      } else {
        setDisplayedText(fullText.slice(0, i));
      }
    }, 12);
    return () => clearInterval(timer);
  }, [fullText, isLatest]);

  return (
    <div className="whitespace-pre-wrap leading-relaxed space-y-1">
      {displayedText.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, idx) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return <strong key={idx} className="font-semibold text-slate-900">{p.slice(2, -2)}</strong>;
              }
              return p;
            })}
          </p>
        );
      })}
    </div>
  );
};

export const TanyaTerangModal: React.FC<TanyaTerangModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'bot',
      text: 'Selamat datang di **Pusat Informasi TERANG**. Anda dapat menanyakan rincian APBD, perbandingan daerah, proyek berkendala kesenjangan, atau statistik aduan publik di Sumatera Utara.',
      timestamp: 'Baru saja',
      driver: 'gemini',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    'Berapa serapan anggaran di Deli Serdang?',
    'Proyek apa yang memiliki indikator kesenjangan tinggi?',
    'Bandingkan serapan Kota Medan vs Deli Serdang',
    'Berapa banyak laporan warga yang sudah selesai?',
    'Tampilkan 5 daerah dengan serapan APBD terendah',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'Data berhasil diproses dari basis data TERANG.',
        toolUsed: data.toolUsed,
        driver: data.driver || 'gemini',
        dataLinks: data.dataLinks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Maaf, terjadi kendala koneksi ke server. Namun seluruh data APBD dan proyek tetap dapat diakses langsung pada menu navigasi.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          driver: 'fallback',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: 'up' | 'down') => {
    setFeedbackSent((prev) => ({ ...prev, [msgId]: true }));
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nilai: rating === 'up' ? 5 : 1, fitur: 'chatbot_tanya_terang' }),
      });
    } catch {
      /* quiet */
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[88dvh] sm:h-[600px] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-[#0B7C8A] text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between border-b border-teal-700/30 shrink-0">
          <div className="flex items-center gap-2.5 max-w-[70%]">
            <div className="w-8 h-8 rounded-lg bg-[#0FA3B1] flex items-center justify-center text-white shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-sm font-display text-white">Pusat Informasi TERANG</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  REALTIME DATA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-200 truncate">Layanan Informasi Anggaran &amp; Aduan Publik Sumut</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigate('agent-automation');
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 text-xs font-bold border border-teal-500/40 transition-colors hidden sm:inline-block cursor-pointer"
            >
              Pusat Otonom &rarr;
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Tutup pusat informasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat message body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-[#0FA3B1] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-xl p-3.5 shadow-xs ${
                m.sender === 'user'
                  ? 'bg-[#0B7C8A] text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }`}>
                {/* Text formatting with typewriter animation */}
                {m.sender === 'bot' ? (
                  <TypewriterText fullText={m.text} isLatest={m.id === messages[messages.length - 1]?.id} />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                    {m.text}
                  </div>
                )}

                {/* Data link CTA if provided */}
                {m.dataLinks && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate(m.dataLinks!.replace('/', ''));
                      }}
                      className="text-xs text-[#0FA3B1] hover:text-[#0c8a96] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Lihat data langsung di dashboard</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Footer metadata & Copy CTA for bot messages */}
                {m.sender === 'bot' && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 gap-2">
                    <span className="flex items-center gap-1">
                      <span>{m.timestamp}</span>
                      <span>·</span>
                      <span className="text-teal-600 font-medium">Terverifikasi</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Copy Button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(m.text.replace(/\*\*/g, ''));
                          setCopiedMsgId(m.id);
                          setTimeout(() => setCopiedMsgId(null), 2000);
                        }}
                        className="text-slate-400 hover:text-slate-700 font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100/80 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Salin jawaban ke clipboard"
                      >
                        {copiedMsgId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{copiedMsgId === m.id ? 'Tersalin' : 'Salin'}</span>
                      </button>

                      {/* Feedback thumbs */}
                      {!feedbackSent[m.id] ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(m.id, 'up')}
                            className="hover:text-teal-600 p-0.5 rounded cursor-pointer"
                            title="Bermanfaat"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, 'down')}
                            className="hover:text-red-500 p-0.5 rounded cursor-pointer"
                            title="Kurang akurat"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-teal-600 font-medium">Terima kasih!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-500 text-xs">
              <div className="w-7 h-7 rounded-full bg-[#0FA3B1] text-white flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <span>Memeriksa database APBD &amp; menyusun jawaban...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt buttons */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap shrink-0">Contoh Pertanyaan:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ketik pertanyaan terkait data anggaran atau proyek publik..."
            className="flex-1 text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#0FA3B1] focus:border-[#0FA3B1]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="bg-[#0B7C8A] hover:bg-[#096A76] text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
