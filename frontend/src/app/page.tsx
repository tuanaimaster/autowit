'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Bot, CheckCircle2, Code2, FileText, Lightbulb,
  MessageSquare, PenLine, Rocket, ShieldCheck, Sparkles,
  Target, TrendingUp, Workflow, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

type RoadmapStatus = 'backlog' | 'todo' | 'in_development' | 'done';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  votes: number;
  tag: string;
  status: RoadmapStatus;
}

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    id: 'rw-001',
    title: 'Workflow builder kéo-thả',
    description: 'Thiết kế luồng tự động nhiều bước với trigger, condition và action không cần code.',
    votes: 15,
    tag: 'Tính năng',
    status: 'backlog',
  },
  {
    id: 'rw-002',
    title: 'Template tự động hóa theo ngành',
    description: 'Bộ template sẵn cho marketing, CSKH, vận hành và sales để triển khai nhanh.',
    votes: 8,
    tag: 'Tính năng',
    status: 'backlog',
  },
  {
    id: 'rw-003',
    title: 'Trigger đa kênh: Form, Email, Telegram',
    description: 'Khởi chạy workflow từ nhiều nguồn sự kiện và đồng bộ về một luồng xử lý thống nhất.',
    votes: 12,
    tag: 'Tích hợp',
    status: 'todo',
  },
  {
    id: 'rw-004',
    title: 'AI Agent phân loại và trả lời ticket',
    description: 'Agent tự đọc ngữ cảnh, gán nhãn yêu cầu và đề xuất phản hồi theo playbook của team.',
    votes: 15,
    tag: 'AI Agent',
    status: 'todo',
  },
  {
    id: 'rw-005',
    title: 'Orchestration n8n + Webhook hub',
    description: 'Điều phối workflow liên dịch vụ, retry thông minh và theo dõi trạng thái realtime.',
    votes: 18,
    tag: 'Tích hợp',
    status: 'in_development',
  },
  {
    id: 'rw-006',
    title: 'Dashboard SLA và hiệu suất tác vụ',
    description: 'Theo dõi thời gian xử lý, tỷ lệ thành công và cảnh báo nghẽn luồng theo thời gian thực.',
    votes: 9,
    tag: 'Sửa đổi',
    status: 'done',
  },
  {
    id: 'rw-007',
    title: 'Core infrastructure v3.2',
    description: 'Cải tiến logger, constants và độ ổn định module API.',
    votes: 6,
    tag: 'Hạ tầng',
    status: 'done',
  },
];

const ROADMAP_COLUMNS: Array<{ status: RoadmapStatus; label: string; accent: string }> = [
  { status: 'backlog', label: 'Backlog', accent: 'border-slate-500/60' },
  { status: 'todo', label: 'To Do', accent: 'border-blue-500/70' },
  { status: 'in_development', label: 'In Development', accent: 'border-amber-500/80' },
  { status: 'done', label: 'Done', accent: 'border-emerald-500/70' },
];

export default function HomePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDetail, setSuggestionDetail] = useState('');
  const [suggestionTags, setSuggestionTags] = useState('AI, Tự động hóa');
  const [votedItems, setVotedItems] = useState<Record<string, boolean>>({});

  const groupedRoadmap = useMemo(() => {
    return ROADMAP_COLUMNS.map((col) => ({
      ...col,
      items: ROADMAP_ITEMS.filter((item) => item.status === col.status),
    }));
  }, []);

  const roadmapVoteStorageKey = 'aw_roadmap_votes_v1';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(roadmapVoteStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;
        setVotedItems(parsed);
      }
    } catch {
      // Ignore invalid local vote cache.
    }
  }, []);

  async function handleSuggestionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = typeof window !== 'undefined' ? localStorage.getItem('aw_token') : null;
    if (!token) {
      toast('Vui lòng đăng nhập để gửi đề xuất.', { icon: '🔐' });
      router.push('/login?next=/');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = suggestionTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.post('/ideas', {
        title: suggestionTitle,
        description: suggestionDetail,
        tags,
      });

      toast.success('Đã gửi đề xuất thành công. Cảm ơn bạn đã đóng góp roadmap!');
      setSuggestionTitle('');
      setSuggestionDetail('');
      setSuggestionTags('AI, Tự động hóa');
    } catch {
      toast.error('Không thể gửi đề xuất lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleVote(item: RoadmapItem) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aw_token') : null;
    if (!token) {
      toast('Vui lòng đăng nhập để vote roadmap.', { icon: '🔐' });
      router.push('/login?next=/');
      return;
    }

    if (votedItems[item.id]) {
      toast('Bạn đã vote mục này rồi.', { icon: '✅' });
      return;
    }

    const nextVotes = { ...votedItems, [item.id]: true };
    setVotedItems(nextVotes);
    if (typeof window !== 'undefined') {
      localStorage.setItem(roadmapVoteStorageKey, JSON.stringify(nextVotes));
    }
    toast.success(`Đã vote cho: ${item.title}`);
  }

  return (
    <main className="min-h-screen bg-surface text-white">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-surface-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.14),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-900/20 px-3 py-1 text-xs text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            4 AI Agent chuyên biệt · Ollama + OpenAI + Claude · n8n integration
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            AI trợ lý cho code, content, sales và automation — trong một nền tảng.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Gửi yêu cầu bằng tiếng Việt hoặc tiếng Anh. Autowit tự chọn đúng agent, xử lý và lưu kết quả vào task của bạn. Kết nối n8n, Telegram, webhook — không cần code thêm.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => router.push('/login')} className="btn-primary inline-flex items-center gap-2">
              Bắt đầu miễn phí
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-ghost border border-surface-border">
              Xem dashboard
            </button>
          </div>

          {/* Mini demo prompt */}
          <div className="mt-10 max-w-2xl rounded-2xl border border-surface-border bg-surface-elevated/80 p-4 text-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ví dụ — Auto-route</p>
            <div className="space-y-2">
              {[
                { user: 'Viết cold email cho khách hàng SaaS B2B', agent: 'Sales Agent · đang soạn…' },
                { user: 'Tạo n8n workflow nhận form → gửi Telegram', agent: 'Automation Agent · đang thiết kế workflow…' },
                { user: 'Debug đoạn TypeScript này bị lỗi type', agent: 'Code Agent · đang phân tích…' },
              ].map((ex, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-xl border border-surface-border bg-surface p-2.5">
                  <span className="flex items-center gap-1.5 text-xs text-white">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" /> {ex.user}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-brand-300">
                    <Bot className="h-3 w-3" /> {ex.agent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="border-b border-surface-border bg-surface-elevated/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold">Cách hoạt động</h2>
          <p className="mt-1 text-sm text-muted-foreground">3 bước từ câu hỏi đến kết quả.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: MessageSquare,
                color: 'text-brand-300',
                title: 'Gõ yêu cầu của bạn',
                desc: 'Tự nhiên bằng tiếng Việt hay tiếng Anh. Không cần chọn agent — MetaController tự phân tích intent.',
              },
              {
                step: '02',
                icon: Zap,
                color: 'text-amber-300',
                title: 'Agent phù hợp xử lý',
                desc: 'Code, Content, Sales hoặc Automation agent nhận request. LLM Router chọn model tối ưu chi phí: Ollama → OpenAI → Claude.',
              },
              {
                step: '03',
                icon: CheckCircle2,
                color: 'text-emerald-300',
                title: 'Kết quả + lưu context',
                desc: 'Phản hồi được stream realtime. Session được lưu — agent nhớ cuộc trò chuyện. Task và workflow cập nhật tự động.',
              },
            ].map((item) => (
              <div key={item.step} className="card relative">
                <span className="absolute right-4 top-4 text-3xl font-black text-surface-border">{item.step}</span>
                <item.icon className={`h-6 w-6 ${item.color}`} />
                <p className="mt-3 font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 AI AGENTS ────────────────────────────────────────── */}
      <section className="border-b border-surface-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">4 AI Agent chuyên biệt</h2>
            <p className="mt-1 text-sm text-muted-foreground">Mỗi agent được prompt-engineer cho một lĩnh vực cụ thể.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Code2,
                color: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
                name: 'Code Agent',
                tag: '/code',
                desc: 'Viết code, debug, code review, kiến trúc hệ thống. Hỗ trợ TypeScript, Python, SQL, Bash và hơn 20 ngôn ngữ.',
                example: '"Review đoạn NestJS service này và tối ưu query N+1"',
              },
              {
                icon: PenLine,
                color: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
                name: 'Content Agent',
                tag: '/content',
                desc: 'Blog, social media copy, email marketing, SEO, video script. Viết theo tone & style yêu cầu.',
                example: '"Viết 5 caption Instagram cho sản phẩm SaaS B2B"',
              },
              {
                icon: Target,
                color: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
                name: 'Sales Agent',
                tag: '/sales',
                desc: 'Cold email, outreach script, xử lý objection, CRM notes, deal pipeline, follow-up sequence.',
                example: '"Soạn email outreach cho startup Fintech, chưa từng nghe về chúng tôi"',
              },
              {
                icon: Workflow,
                color: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
                name: 'Automation Agent',
                tag: '/auto',
                desc: 'Thiết kế n8n workflow, API integration, webhook, Telegram/Zalo bot, data transformation.',
                example: '"Tạo n8n flow: Google Form → lọc → gửi Telegram + lưu Sheets"',
              },
            ].map((agent) => (
              <div key={agent.name} className={`card border ${agent.color.split(' ').find(c => c.startsWith('border-')) ?? ''}`}>
                <div className={`inline-flex items-center justify-center rounded-lg p-2 ${agent.color.split(' ').filter(c => !c.startsWith('text-') && !c.startsWith('border-')).join(' ')}`}>
                  <agent.icon className={`h-5 w-5 ${agent.color.split(' ').find(c => c.startsWith('text-')) ?? ''}`} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <p className="font-semibold">{agent.name}</p>
                  <span className="rounded bg-surface-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{agent.tag}</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                <div className="mt-3 rounded-lg border border-surface-border bg-surface p-2 text-[11px] italic text-muted-foreground">
                  {agent.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ───────────────────────────────────────── */}
      <section className="border-b border-surface-border bg-surface-elevated/30">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold">Tích hợp sẵn, không cần cấu hình lại</h2>
          <p className="mt-1 text-sm text-muted-foreground">Stack được chọn để chạy được ngay trên VPS nhỏ.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Bot,
                color: 'text-brand-300',
                title: 'LLM Router thông minh',
                desc: 'Ưu tiên Ollama (miễn phí, local) → OpenAI → Claude. Tự fallback khi model lỗi. Track chi phí theo từng session.',
              },
              {
                icon: Workflow,
                color: 'text-amber-300',
                title: 'n8n Orchestration',
                desc: 'Tích hợp n8n để điều phối workflow phức tạp đa bước. Retry thông minh, webhook hub, theo dõi realtime.',
              },
              {
                icon: MessageSquare,
                color: 'text-blue-300',
                title: 'Telegram Bot',
                desc: 'Chat với AI agent qua Telegram. Gõ /code, /content, /sales hoặc /auto — hoặc nhắn tự do, bot tự route.',
              },
              {
                icon: TrendingUp,
                color: 'text-emerald-300',
                title: 'Task & Workflow Manager',
                desc: 'Dashboard để quản lý task, workflow, theo dõi SLA và chi phí AI. Role-based access cho toàn team.',
              },
            ].map((item) => (
              <div key={item.title} className="card">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <p className="mt-3 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Roadmap phát triển</h2>
            <p className="mt-1 text-sm text-muted-foreground">Công khai tiến độ và ưu tiên theo đóng góp cộng đồng. Vote để đưa tính năng bạn cần lên đầu danh sách.</p>
          </div>
          <span className="badge badge-purple">Live roadmap</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          {groupedRoadmap.map((column) => (
            <div key={column.status} className={`rounded-2xl border bg-surface-elevated/60 p-4 ${column.accent}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide">{column.label}</h3>
                <span className="badge badge-gray">{column.items.length}</span>
              </div>
              <div className="space-y-3">
                {column.items.map((item) => (
                  <article key={item.id} className="rounded-xl border border-surface-border bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-snug">{item.title}</h4>
                      <span className="badge badge-purple whitespace-nowrap">{item.tag}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => handleVote(item)}
                        className="rounded-md bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                      >
                        Vote ({item.votes + (votedItems[item.id] ? 1 : 0)})
                      </button>
                      <span className="text-[11px] text-muted-foreground">#{item.id}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS + SUGGESTION ──────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-[1.1fr_1fr]">
        <div className="card">
          <h3 className="text-xl font-semibold">Tại sao dùng Autowit?</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong className="text-white">Không cần chọn agent thủ công</strong> — MetaController đọc intent, tự route đến Code / Content / Sales / Automation agent phù hợp.</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong className="text-white">Chi phí AI tối ưu tự động</strong> — Dùng Ollama miễn phí trước, fallback OpenAI hoặc Claude chỉ khi cần. Track theo session.</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong className="text-white">Context nhớ xuyên session</strong> — Agent lưu lịch sử trò chuyện, không cần giải thích lại từ đầu.</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong className="text-white">Chat qua Telegram ngay</strong> — Không cần mở browser. Nhắn /code, /sales… hoặc tự nhiên, bot tự hiểu.</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span><strong className="text-white">Self-host, dữ liệu của bạn</strong> — Chạy trên VPS riêng. JWT auth, phân quyền role-based, không phụ thuộc vendor.</span>
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <p className="inline-flex items-center gap-2 font-semibold">
              <Rocket className="h-4 w-4" />
              Đang phát triển tích cực. Tính năng mới ưu tiên theo vote cộng đồng.
            </p>
          </div>
        </div>

        <form onSubmit={handleSuggestionSubmit} className="card space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-200">
            <Lightbulb className="h-4 w-4" />
            Đề xuất tính năng
          </div>
          <p className="text-xs text-muted-foreground">
            Muốn thêm agent mới, tích hợp mới, hay cải thiện UX? Gửi đề xuất — đội ngũ sẽ đánh giá và đưa vào roadmap.
          </p>

          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Tên đề xuất</label>
            <input
              value={suggestionTitle}
              onChange={(e) => setSuggestionTitle(e.target.value)}
              className="input w-full"
              placeholder="Ví dụ: Agent viết báo cáo tài chính từ dữ liệu Excel"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Mô tả chi tiết</label>
            <textarea
              value={suggestionDetail}
              onChange={(e) => setSuggestionDetail(e.target.value)}
              className="input min-h-28 w-full resize-y"
              placeholder="Mô tả bài toán bạn đang gặp, lợi ích kỳ vọng"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Tag (phân tách bằng dấu phẩy)</label>
            <input
              value={suggestionTags}
              onChange={(e) => setSuggestionTags(e.target.value)}
              className="input w-full"
              placeholder="AI Agent, n8n, Telegram"
            />
          </div>

          <button disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Đang gửi…' : 'Gửi đề xuất'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>

      {/* ── FOOTER CTA ─────────────────────────────────────────── */}
      <section className="border-t border-surface-border bg-surface-elevated/30">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h2 className="text-2xl font-bold">Bắt đầu dùng Autowit hôm nay</h2>
          <p className="mt-2 text-sm text-muted-foreground">Đăng ký miễn phí · Không cần credit card · Self-host hoặc dùng cloud.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => router.push('/login')} className="btn-primary inline-flex items-center gap-2">
              Tạo tài khoản
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-ghost border border-surface-border">
              Xem dashboard demo
            </button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> JWT Auth + Role-based</span>
            <span className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-brand-300" /> Ollama · OpenAI · Claude</span>
            <span className="flex items-center gap-1.5"><Workflow className="h-3.5 w-3.5 text-amber-300" /> n8n + Telegram sẵn</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-blue-300" /> Self-host on VPS</span>
          </div>
        </div>
      </section>

    </main>
  );
}
