'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const CHANNEL_META = {
  telegram:  { label: 'Telegram',  emoji: '✈️', fields: ['TELEGRAM_BOT_TOKEN'] },
  whatsapp:  { label: 'WhatsApp',  emoji: '💬', fields: ['WHATSAPP_PHONE_ID', 'WHATSAPP_ACCESS_TOKEN'] },
  zalo:      { label: 'Zalo',      emoji: '🔵', fields: ['ZALO_APP_ID', 'ZALO_APP_SECRET', 'ZALO_OA_ACCESS_TOKEN'] },
  facebook:  { label: 'Facebook',  emoji: '📘', fields: ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'] },
  x:         { label: 'X / Twitter', emoji: '🐦', fields: ['X_API_KEY', 'X_API_SECRET', 'X_BEARER_TOKEN'] },
  notion:    { label: 'Notion',    emoji: '📓', fields: ['NOTION_INTEGRATION_TOKEN', 'NOTION_DATABASE_ID'] },
  youtube:   { label: 'YouTube',   emoji: '▶️', fields: ['YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_ID'] },
};

export default function AdminPage() {
  const qc = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data) });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/admin/users').then(r => r.data) });
  const { data: channels, isLoading } = useQuery({ queryKey: ['channels'], queryFn: () => api.get('/channels').then(r => r.data) });

  const toggleMutation = useMutation({
    mutationFn: (type: string) => api.post(`/channels/${type}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }); toast.success('Channel updated'); },
  });

  const [editChannel, setEditChannel] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: ({ type, config }: { type: string; config: Record<string, string> }) =>
      api.put(`/channels/${type}`, { name: CHANNEL_META[type as keyof typeof CHANNEL_META]?.label ?? type, config }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['channels'] }); setEditChannel(null); toast.success('Config saved'); },
  });

  const channelMap = Object.fromEntries((channels ?? []).map((c: { type: string }) => [c.type, c]));

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Admin</h1>

      {/* Cost stats */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-3">AI Cost (Today)</h2>
        <p className="text-3xl font-bold text-white">${parseFloat(stats?.today?.['total:cost'] ?? '0').toFixed(4)}</p>
        <p className="text-xs text-muted-foreground mt-1">Weekly total: ${stats?.weeklyTotalUsd ?? '0'}</p>
      </div>

      {/* Channels */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-brand-400" /> Channels</h2>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-brand-400" /> : (
          <div className="space-y-3">
            {Object.entries(CHANNEL_META).map(([type, meta]) => {
              const ch = channelMap[type];
              return (
                <div key={type} className="flex items-center gap-4 py-2 border-b border-surface-border last:border-0">
                  <span className="text-lg w-6">{meta.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{meta.label}</p>
                  </div>
                  <button onClick={() => {
                    setEditChannel(editChannel === type ? null : type);
                    setConfigValues((ch?.config as Record<string, string>) ?? {});
                  }} className="btn-ghost text-xs py-1 px-2">Config</button>
                  <button onClick={() => toggleMutation.mutate(type)}>
                    {ch?.isActive
                      ? <ToggleRight className="w-6 h-6 text-brand-400" />
                      : <ToggleLeft className="w-6 h-6 text-muted" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline config editor */}
        {editChannel && (
          <div className="mt-4 p-4 bg-surface-subtle rounded-lg border border-surface-border space-y-3">
            <p className="text-sm font-medium text-white">Configure {CHANNEL_META[editChannel as keyof typeof CHANNEL_META]?.label}</p>
            {CHANNEL_META[editChannel as keyof typeof CHANNEL_META]?.fields.map(field => (
              <div key={field}>
                <label className="text-xs text-muted-foreground">{field}</label>
                <input
                  type="password"
                  value={configValues[field] ?? ''}
                  onChange={e => setConfigValues(prev => ({ ...prev, [field]: e.target.value }))}
                  className="input w-full mt-1 text-sm"
                  placeholder={`Enter ${field}…`}
                />
              </div>
            ))}
            <button onClick={() => updateMutation.mutate({ type: editChannel, config: configValues })} className="btn-primary text-sm">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Users */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Users ({(users?.total ?? (users?.data?.length ?? 0))})</h2>
        <div className="space-y-2">
          {(users?.data ?? []).slice(0, 20).map((u: { id: string; email: string; name?: string; role: string; createdAt: string }) => (
            <div key={u.id} className="flex items-center justify-between text-sm py-1.5 border-b border-surface-border last:border-0">
              <div>
                <p className="text-white font-medium">{u.name ?? u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-gray'}`}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
