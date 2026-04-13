'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task { id: string; title: string; status: TaskStatus; priority: TaskPriority; dueDate?: string }

const COLUMNS: { key: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'todo',        label: 'To Do',       icon: Circle,       color: 'text-muted-foreground' },
  { key: 'in_progress', label: 'In Progress',  icon: Clock,        color: 'text-blue-400' },
  { key: 'review',      label: 'Review',       icon: AlertCircle,  color: 'text-yellow-400' },
  { key: 'done',        label: 'Done',         icon: CheckCircle2, color: 'text-green-400' },
];

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low:    'badge-gray',
  medium: 'badge-purple',
  high:   'badge-yellow',
  urgent: 'badge-red',
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: kanban, isLoading } = useQuery<Record<TaskStatus, Task[]>>({
    queryKey: ['kanban'],
    queryFn: () => api.get('/tasks/kanban').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => api.post('/tasks', { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kanban'] }); setNewTitle(''); setCreating(false); toast.success('Task created'); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => api.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban'] }),
  });

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tasks</h1>
        {creating ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createMutation.mutate(newTitle); if (e.key === 'Escape') { setCreating(false); setNewTitle(''); } }}
              placeholder="Task title…"
              className="input text-sm w-64"
            />
            <button onClick={() => createMutation.mutate(newTitle)} className="btn-primary text-sm" disabled={!newTitle.trim()}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-medium text-white">{label}</span>
                <span className="badge-gray badge ml-auto">{(kanban?.[key] ?? []).length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {(kanban?.[key] ?? []).map((task: Task) => (
                  <div key={task.id} className="card py-3 px-3 cursor-pointer hover:border-brand-600/40 transition-colors group">
                    <p className="text-sm text-white leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                      <select
                        value={task.status}
                        onChange={e => statusMutation.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                        onClick={e => e.stopPropagation()}
                        className="ml-auto text-xs bg-transparent border-0 text-muted-foreground focus:outline-none"
                      >
                        {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
