'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Play, Zap, Globe } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Workflow {
  id: string; name: string; description?: string; status: 'active' | 'inactive' | 'draft';
  trigger: string; runCount: number; lastRunAt?: string;
}

const STATUS_COLOR: Record<string, string> = {
  active:   'badge-green',
  inactive: 'badge-gray',
  draft:    'badge-yellow',
};

export default function WorkflowsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: () => api.get('/workflows').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/workflows', { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); setNewName(''); setCreating(false); toast.success('Workflow created'); },
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/workflows/${id}/execute`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Workflow executed'); },
    onError: () => toast.error('Execution failed'),
  });

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Workflows</h1>
        {creating ? (
          <div className="flex gap-2">
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createMutation.mutate(newName); if (e.key === 'Escape') { setCreating(false); } }}
              placeholder="Workflow name…" className="input text-sm w-64" />
            <button onClick={() => createMutation.mutate(newName)} className="btn-primary text-sm" disabled={!newName.trim()}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> New Workflow
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center pt-16"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(workflows ?? []).map((wf: Workflow) => (
            <div key={wf.id} className="card hover:border-brand-600/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-brand-400" />
                </div>
                <span className={`badge ${STATUS_COLOR[wf.status]}`}>{wf.status}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{wf.name}</h3>
              {wf.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{wf.description}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {wf.trigger} · {wf.runCount} runs
                </span>
                <button
                  onClick={() => executeMutation.mutate(wf.id)}
                  disabled={executeMutation.isPending}
                  className="flex items-center gap-1 text-xs btn-ghost py-1"
                >
                  <Play className="w-3 h-3" /> Run
                </button>
              </div>
            </div>
          ))}
          {(workflows ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground col-span-3">No workflows yet. Create one to automate tasks with n8n.</p>
          )}
        </div>
      )}
    </div>
  );
}
