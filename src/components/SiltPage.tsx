import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

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

const FILTERS = ['all', 'image', 'video', 'audio', 'text', 'other'] as const;
type Filter = (typeof FILTERS)[number];

function bucket(file: File): Filter {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (t.startsWith('text/') || t.includes('json') || t.includes('xml')) return 'text';
  return 'other';
}

export default function SiltPage() {
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [kept, setKept] = useState<{ name: string; size: number; type: string } | null>(null);

  const send = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    const chosen = files.filter((f) => filter === 'all' || bucket(f) === filter);
    const file = chosen[0] || files[0];
    setErr('');
    setEmbed('');
    setApp('');
    setKept({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(
      file.size > 40 * 1024 * 1024
        ? 'heavy silt. encoding might feel sleepy. no hard cap.'
        : filter !== 'all' && !chosen.length
          ? 'nothing matched the sieve. publishing the first file instead.'
          : '',
    );
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
      });
      if (!res.ok) {
        setErr(res.error || 'silt would not settle');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'silt stayed cloudy');
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
          <p className="text-[#0a84ff] text-sm mb-2">silt</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sieve by kind, then let one file settle.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a type, drop a pile, we keep the first match and send it to the share db. discord still uses /s.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[13px] transition ${
                  filter === f ? 'bg-white text-black' : 'bg-white/8 text-neutral-300 hover:bg-white/12'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'letting the silt settle…' : 'drop files into the silt'}</p>
            <p className="text-xs text-neutral-500 mt-2">no size lock. we only tap you if the tab might lag.</p>
          </label>
          {kept && (
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/8 px-4 py-3 text-sm text-neutral-300">
              <p>{kept.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{pretty(kept.size)} · {kept.type}</p>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
