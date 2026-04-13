'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Agent = 'auto' | 'code' | 'content' | 'sales' | 'automation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  costUsd?: number;
  cached?: boolean;
  agentName?: string;
}

const AGENTS: { value: Agent; label: string }[] = [
  { value: 'auto',       label: '⚡ Auto-route' },
  { value: 'code',       label: '💻 Code' },
  { value: 'content',    label: '✍️ Content' },
  { value: 'sales',      label: '📈 Sales' },
  { value: 'automation', label: '🔁 Automation' },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<Agent>('auto');
  const [streaming, setStreaming] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = user?.id ?? 'anon';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStreaming('');

    try {
      // Use streaming endpoint
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aw_token')}`,
        },
        body: JSON.stringify({
          message: userMsg.content,
          sessionId,
          agent: agent === 'auto' ? undefined : agent,
        }),
      });

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let meta: { model?: string; costUsd?: number } = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const json = JSON.parse(line.slice(6));
          if (json.token) { fullText += json.token; setStreaming(fullText); }
          if (json.done) { meta = { model: json.model, costUsd: json.costUsd }; }
        }
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullText,
        ...meta,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreaming('');
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Error: Could not get a response. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
        <h1 className="text-lg font-semibold text-white">AI Chat</h1>
        <select
          value={agent}
          onChange={e => setAgent(e.target.value as Agent)}
          className="input text-sm py-1 pr-8"
        >
          {AGENTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <Bot className="w-12 h-12 text-brand-400" />
            <p className="text-sm text-muted-foreground">Choose an agent and start chatting</p>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={clsx('flex gap-3 animate-fade-in', m.role === 'user' && 'flex-row-reverse')}>
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
              m.role === 'user' ? 'bg-brand-600' : 'bg-surface-elevated border border-surface-border',
            )}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-brand-400" />}
            </div>
            <div className={clsx(
              'max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
              m.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-surface-elevated text-white border border-surface-border rounded-tl-sm',
            )}>
              {m.content}
              {m.model && m.model !== 'cache' && (
                <p className="mt-1 text-xs text-muted opacity-60">
                  {m.model} · ${m.costUsd?.toFixed(5) ?? '0'}
                </p>
              )}
              {m.cached && <p className="mt-1 text-xs text-emerald-500 opacity-70">cached</p>}
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-surface-elevated border border-surface-border shrink-0">
              <Bot className="w-3.5 h-3.5 text-brand-400 animate-pulse-soft" />
            </div>
            <div className="max-w-[75%] bg-surface-elevated border border-surface-border rounded-xl rounded-tl-sm px-4 py-3 text-sm whitespace-pre-wrap text-white">
              {streaming}<span className="animate-pulse-soft">▋</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-surface-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything… (Shift+Enter for new line)"
            rows={2}
            className="input flex-1 resize-none"
          />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-primary self-end px-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
