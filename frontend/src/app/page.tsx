'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, CheckCircle2, Lightbulb, Rocket, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
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
    title: 'Kết nối ngân hàng tự động',
    description: 'Đồng bộ giao dịch từ tài khoản ngân hàng qua API để phân loại tức thì.',
    votes: 15,
    tag: 'Tính năng',
    status: 'backlog',
  },
  {
    id: 'rw-002',
    title: 'Scan hóa đơn bằng AI',
    description: 'OCR tự động trích xuất dữ liệu chi tiêu từ hóa đơn và biên lai.',
    votes: 8,
    tag: 'Tính năng',
    status: 'backlog',
  },
  {
    id: 'rw-003',
    title: 'Bot command theo giọng nói',
    description: 'Gửi lệnh nhanh qua Telegram, bot parse ý định và tạo giao dịch.',
    votes: 12,
    tag: 'Tính năng',
    status: 'todo',
  },
  {
    id: 'rw-004',
    title: 'Bot nhắc chi tiêu thông minh',
    description: 'Cảnh báo khi vượt ngân sách theo nhóm chi và ngữ cảnh cá nhân.',
    votes: 15,
    tag: 'AI',
    status: 'todo',
  },
  {
    id: 'rw-005',
    title: 'Tích hợp Telegram bot với FreedomWallet',
    description: 'Liên kết luồng chat để đề xuất hành động tài chính ngay trong hội thoại.',
    votes: 18,
    tag: 'Tích hợp',
    status: 'in_development',
  },
  {
    id: 'rw-006',
    title: 'Mobile asset price updates',
    description: 'Cập nhật giá tài sản theo thời gian thực trên giao diện mobile.',
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

  const groupedRoadmap = useMemo(() => {
    return ROADMAP_COLUMNS.map((col) => ({
      ...col,
      items: ROADMAP_ITEMS.filter((item) => item.status === col.status),
    }));
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

  return (
    <main className="min-h-screen bg-surface text-white">
      <section className="relative overflow-hidden border-b border-surface-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.14),transparent_35%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/40 bg-brand-900/20 px-3 py-1 text-xs text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            Nền tảng AI vận hành tài chính thông minh cho cá nhân và đội nhóm
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
            Autowit giúp bạn quản lý tài chính, tự động hóa tác vụ và phát triển sản phẩm theo góp ý người dùng.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            Theo dõi roadmap real-time, đề xuất tính năng mới, ưu tiên bằng vote và nhận trợ lý AI hỗ trợ ra quyết định nhanh hơn.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => router.push('/login')} className="btn-primary inline-flex items-center gap-2">
              Đăng nhập ngay
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => router.push('/dashboard')} className="btn-ghost border border-surface-border">
              Vào dashboard
            </button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="card border-brand-600/40">
              <Bot className="h-5 w-5 text-brand-300" />
              <p className="mt-3 text-sm font-semibold">AI đa tầng tối ưu chi phí</p>
              <p className="mt-1 text-xs text-muted-foreground">Ưu tiên model nội bộ trước, fallback model cloud khi cần.</p>
            </div>
            <div className="card border-blue-500/40">
              <TrendingUp className="h-5 w-5 text-blue-300" />
              <p className="mt-3 text-sm font-semibold">Quản trị vận hành theo dữ liệu</p>
              <p className="mt-1 text-xs text-muted-foreground">Nhìn thấy tiến độ, công việc và hiệu suất theo từng luồng.</p>
            </div>
            <div className="card border-emerald-500/40">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 text-sm font-semibold">Bảo mật và kiểm soát quyền truy cập</p>
              <p className="mt-1 text-xs text-muted-foreground">JWT auth, phân quyền role-based và audit sẵn sàng mở rộng.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Roadmap phát triển</h2>
            <p className="mt-1 text-sm text-muted-foreground">Công khai tiến độ theo từng giai đoạn và ưu tiên theo đóng góp cộng đồng.</p>
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
                      <button className="rounded-md bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
                        Vote ({item.votes})
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

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-[1.1fr_1fr]">
        <div className="card">
          <h3 className="text-xl font-semibold">Lợi ích khi triển khai Autowit</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              Tăng tốc xử lý công việc lặp lại nhờ workflow tự động và trợ lý AI.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              Minh bạch ưu tiên phát triển sản phẩm dựa trên nhu cầu thật của user.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              Tập trung tăng trưởng bằng các chỉ số rõ ràng thay vì cảm tính.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <p className="inline-flex items-center gap-2 font-semibold">
              <Rocket className="h-4 w-4" />
              Phiên bản hiện tại ưu tiên nhanh tốc độ ra mắt, sẽ tiếp tục nâng cấp theo roadmap cộng đồng.
            </p>
          </div>
        </div>

        <form onSubmit={handleSuggestionSubmit} className="card space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-200">
            <Lightbulb className="h-4 w-4" />
            Đề xuất nâng cấp theo roadmap
          </div>
          <p className="text-xs text-muted-foreground">
            Bạn có thể đề xuất tính năng mới, cải tiến UX hoặc luồng tự động hóa. Đề xuất sẽ được đưa vào backlog để đội ngũ đánh giá.
          </p>

          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Tên đề xuất</label>
            <input
              value={suggestionTitle}
              onChange={(e) => setSuggestionTitle(e.target.value)}
              className="input w-full"
              placeholder="Ví dụ: Đồng bộ ngân hàng theo thời gian thực"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Mô tả chi tiết</label>
            <textarea
              value={suggestionDetail}
              onChange={(e) => setSuggestionDetail(e.target.value)}
              className="input min-h-28 w-full resize-y"
              placeholder="Mô tả nhu cầu, lợi ích và cách bạn muốn tính năng hoạt động"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Tag (phân tách bằng dấu phẩy)</label>
            <input
              value={suggestionTags}
              onChange={(e) => setSuggestionTags(e.target.value)}
              className="input w-full"
              placeholder="AI, Tự động hóa, Telegram"
            />
          </div>

          <button disabled={isSubmitting} className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Đang gửi đề xuất...' : 'Gửi đề xuất'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
