import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function LatchPage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [stats, setStats] = useState<{ name: string; size: number; type: string } | null>(null);
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const send = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setErr('');
    setEmbed('');
    setApp('');
    setStats({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 40 * 1024 * 1024 ? 'heavy latch. encoding might feel sleepy. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        lockPass: pass.trim() || undefined,
        caption: pass.trim() || file.name,
        cardTitle: pass.trim() || file.name,
      });
      if (!res.ok) {
        setErr(res.error || 'latch would not close');
        return;
      }
      if (res.warn) setWarn(res.warn);
      await fetch(`${SB_URL}/rest/v1/latches`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id,
          phrase: (pass.trim() || file.name).slice(0, 80),
          note: null,
          author: null,
          file_name: file.name,
          size: file.size,
          share_id: id,
          file_url: res.url || null,
          hold_hours: null,
        }),
      }).catch(() => null);
      const urls = shareUrls(id);
      setEmbed(`${location.origin}/latch/${id}`);
      setApp(urls.app || urls.embed);
      try { await navigator.clipboard.writeText(`${location.origin}/latch/${id}`); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'latch stuck');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">latch</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">optional phrase, then a public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            the file lands in the share db and a latch row. friends with the phrase can open it. discord gets a card on /latch/id. no size lock.
          </p>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="optional latch phrase"
            className="w-full mb-4 rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'closing the latch…' : 'drop one file on the latch'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only tap you if the tab might lag.</p>
          </label>
          {stats && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 text-sm text-neutral-300">
              <p>{stats.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{pretty(stats.size)} · {stats.type}{pass.trim() ? ' · latched' : ''}</p>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord card (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {app}</p>
              <button type="button" onClick={() => navigate('hasp')} className="text-xs text-[#6eb6ff]">see the hasp</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
