import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Ovolo = {
  id: string;
  title: string;
  curve: string | null;
  caption: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  share_id: string | null;
  author: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}

export default function OvoloPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [curve, setCurve] = useState('quarter round');
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [rows, setRows] = useState<Ovolo[]>([]);
  const [focus, setFocus] = useState<Ovolo | null>(null);
  const slow = useMemo(
    () => (file && file.size > 40 * 1024 * 1024 ? 'This one is large. The tab may feel slow while it sends. Nothing is refused.' : null),
    [file],
  );

  async function load() {
    const res = await fetch(`${SB_URL}/rest/v1/ovolos?select=*&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as Ovolo[];
    setRows(Array.isArray(data) ? data : []);
    if (shareId) setFocus(data.find((r) => r.id === shareId) || null);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [shareId]);

  async function fileIt() {
    setErr(null);
    setLink(null);
    if (!title.trim()) {
      setErr('A label needs a title.');
      return;
    }
    if (!file) {
      setErr('Pick a local file. The curve is the label, not the cabinet.');
      return;
    }
    setBusy(true);
    try {
      const published = await publishLocalFile(file, {
        caption: caption.trim() || curve.trim(),
        author: author.trim() || undefined,
        cardTitle: title.trim(),
        color: '#64D2FF',
        meta: { desk: 'ovolo', curve: curve.trim() },
      });
      if (!published.ok || !published.id) {
        setErr(published.error || 'The share table did not take the file.');
        return;
      }
      const id = published.id;
      const row = {
        id,
        title: title.trim(),
        curve: curve.trim() || null,
        caption: caption.trim() || null,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url || null,
        share_id: published.id,
        author: author.trim() || null,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/ovolos`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!ins.ok) {
        setErr(`ovolos ${ins.status}: ${(await ins.text()).slice(0, 160)}`);
        return;
      }
      setLink(`${location.origin}/ovolo/${id}`);
      setTitle('');
      setCaption('');
      setFile(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">rankvault · not a drawer</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight" style={{ animation: 'ovoloIn .7s cubic-bezier(.2,.8,.2,1) both' }}>
          ovolo
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          A rounded label for one local file. The bytes go to the share table. Paste the link in Discord for a card. Large files are warned, never refused.
        </p>
        <style>{`@keyframes ovoloIn { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: none; } }`}</style>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,.35)] backdrop-blur-xl" style={{ animation: 'ovoloIn .85s cubic-bezier(.2,.8,.2,1) both' }}>
          <label className="block text-sm text-white/70">
            title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 outline-none transition focus:border-[#64D2FF]" placeholder="north stair, morning" />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              curve
              <input value={curve} onChange={(e) => setCurve(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 outline-none transition focus:border-[#64D2FF]" />
            </label>
            <label className="block text-sm text-white/70">
              signed
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 outline-none transition focus:border-[#64D2FF]" placeholder="optional" />
            </label>
          </div>
          <label className="mt-3 block text-sm text-white/70">
            caption people see on the card
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 outline-none transition focus:border-[#64D2FF]" />
          </label>
          <label className="mt-3 block text-sm text-white/70">
            local file
            <input type="file" className="mt-1 block w-full text-sm text-white/70" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {file && <p className="mt-2 text-xs text-white/45">{file.name} · {pretty(file.size)}</p>}
          {slow && <p className="mt-2 text-sm text-amber-300/90">{slow}</p>}
          {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
          <button type="button" disabled={busy} onClick={fileIt} className="mt-4 rounded-full bg-[#64D2FF] px-5 py-2 text-sm font-medium text-black transition duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
            {busy ? 'sending…' : 'file the ovolo'}
          </button>
          {link && (
            <p className="mt-3 text-sm text-white/70">
              card link <a className="text-[#64D2FF] underline" href={link}>{link}</a>
            </p>
          )}
        </section>

        {focus && (
          <article className="mt-6 rounded-3xl border border-[#64D2FF]/30 bg-[#64D2FF]/10 p-5">
            <h2 className="text-xl font-medium">{focus.title}</h2>
            <p className="mt-1 text-sm text-white/60">{[focus.curve, focus.caption].filter(Boolean).join(' · ')}</p>
            {focus.file_url && <a className="mt-2 inline-block text-sm text-[#64D2FF]" href={focus.file_url}>open {focus.file_name || 'file'}</a>}
          </article>
        )}

        <ul className="mt-8 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition duration-300 hover:-translate-y-0.5">
              <a href={`/ovolo/${row.id}`} className="font-medium">{row.title}</a>
              <p className="text-sm text-white/50">{[row.curve, row.file_name, pretty(row.size)].filter(Boolean).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
