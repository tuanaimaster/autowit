'use client';
import { useQuery } from '@tanstack/react-query';
import { Bot, ListTodo, Zap, DollarSign, TrendingUp, Activity } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
  });

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows').then(r => r.data),
  });

  const { data: costStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    enabled: user?.role === 'admin',
  });

  const activeWorkflows = (workflows ?? []).filter((w: { status: string }) => w.status === 'active').length;
  const openTasks = (tasks ?? []).filter((t: { status: string }) => ['todo', 'in_progress'].includes(t.status)).length;
  const todayCost = parseFloat(costStats?.today?.['total:cost'] ?? '0');

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back{user?.name ? `, ${user.name}` : ''} 👋
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Tasks" value={openTasks} icon={ListTodo} color="bg-blue-600" />
        <StatCard label="Active Workflows" value={activeWorkflows} icon={Zap} color="bg-brand-600" />
        <StatCard label="AI Agents" value={5} icon={Bot} color="bg-purple-600" />
        {user?.role === 'admin' && (
          <StatCard label="AI Cost Today" value={`$${todayCost.toFixed(4)}`} icon={DollarSign} color="bg-emerald-600" />
        )}
      </div>

      {/* Recent tasks */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" /> Recent Tasks
        </h2>
        {(tasks ?? []).slice(0, 6).length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet. <a href="/tasks" className="text-brand-400 hover:underline">Create one →</a></p>
        ) : (
          <div className="space-y-2">
            {(tasks ?? []).slice(0, 6).map((t: { id: string; title: string; status: string; priority: string }) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                <span className="text-sm text-white">{t.title}</span>
                <span className={`badge ${
                  t.priority === 'urgent' ? 'badge-red' :
                  t.priority === 'high' ? 'badge-yellow' :
                  t.priority === 'medium' ? 'badge-purple' : 'badge-gray'
                }`}>{t.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
