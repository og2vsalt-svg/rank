import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function GrommetPage() {
  const { navigate } = useRouter();
  const [label, setLabel] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [stats, setStats] = useState<{ name: string; size: number; type: string } | null>(null);
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    const title = (label.trim() || file.name).slice(0, 80);
    setErr('');
    setEmbed('');
    setApp('');
    setStats({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy drop. the tab may feel slow while it sends. no hard cap.' : '');
    setBusy(true);
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || title,
        cardTitle: title,
        author: forWhom.trim() || undefined,
      });
      if (!res.ok || !res.id) {
        setErr(res.error || 'the file did not land');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const row = await fetch(`${SB_URL}/rest/v1/grommets`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: res.id,
          label: title,
          for_whom: forWhom.trim() || null,
          note: note.trim() || null,
          file_name: file.name,
          size: file.size,
          mime: file.type || 'application/octet-stream',
          share_id: res.id,
          file_url: res.url || null,
          author: null,
        }),
      });
      if (!row.ok) {
        setErr('file is in the share table, but the label row did not save');
      }
      const urls = shareUrls(res.id);
      const card = `${location.origin}/grommet/${res.id}`;
      setEmbed(card);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(card); } catch { /* clipboard optional */ }
    } catch (e: any) {
      setErr(e?.message || 'grommet stuck');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">grommet</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">label a file for someone.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a drawer. you name the drop, say who it is for, and the local file lands in the share table. discord gets a card on /grommet/id. older desks stay where they are.
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="label, like invoice or mix"
            className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50"
          />
          <input
            value={forWhom}
            onChange={(e) => setForWhom(e.target.value)}
            placeholder="for whom (optional)"
            className="w-full mb-3 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a short note that rides with the card"
            rows={3}
            className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 resize-none"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition duration-200"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'setting the grommet…' : 'drop one local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only mention it if the tab might lag.</p>
          </label>
          {stats && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 text-sm text-neutral-300">
              <p>{stats.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{pretty(stats.size)} · {stats.type}</p>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord card (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">open link: {app}</p>
              <button type="button" onClick={() => navigate('ring')} className="text-xs text-[#6eb6ff]">see the ring</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
