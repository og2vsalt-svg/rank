import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;
const ACCENTS = ['#0A84FF', '#64D2FF', '#30D158', '#FF9F0A', '#FF375F'];

type Row = {
  id: string;
  title: string;
  looking_for: string;
  notices?: string[] | null;
  accent?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  looks?: number | null;
  created_at?: string;
};

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}
function headers(extra: Record<string, string> = {}) {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...extra };
}
function asNotices(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  return [];
}

export default function LorgnettePage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [notices, setNotices] = useState(['', '', '']);
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const [held, setHeld] = useState(0);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    let gone = false;
    fetch(`${SB_URL}/rest/v1/lorgnettes?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => { if (!gone) setRow(Array.isArray(rows) && rows[0] ? rows[0] : null); })
      .catch(() => { if (!gone) setRow(null); });
    return () => { gone = true; };
  }, [shareId]);

  useEffect(() => {
    if (!row) return;
    const started = Date.now();
    const timer = window.setInterval(() => setHeld(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [row?.id]);

  const marks = useMemo(() => asNotices(row?.notices), [row]);
  const link = row?.id ? `${window.location.origin}/lorgnette/${row.id}` : '';

  const onPick = (list: FileList | null) => {
    const next = list && list[0] ? list[0] : null;
    setFile(next);
    setWarn(next && next.size > SLOW ? 'This one is large. Nothing is blocked — the send may just feel slow.' : '');
  };

  const send = async () => {
    if (!file) { setErr('Choose a file from this computer first.'); return; }
    if (!lookingFor.trim()) { setErr('Say what the glass is for.'); return; }
    setBusy(true);
    setErr('');
    try {
      const published = await publishLocalFile(file, {
        caption: lookingFor.trim(),
        cardTitle: title.trim() || file.name,
        color: accent,
        meta: { desk: 'lorgnette', notices: notices.map((n) => n.trim()).filter(Boolean) },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'the share table did not take the file');
      const id = published.id;
      const body = {
        id,
        title: title.trim() || file.name,
        looking_for: lookingFor.trim(),
        notices: notices.map((n) => n.trim()).filter(Boolean),
        accent,
        share_id: id,
        file_name: file.name,
        file_url: published.url,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        looks: 0,
      };
      const ins = await fetch(`${SB_URL}/rest/v1/lorgnettes`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
      if (!ins.ok) throw new Error((await ins.text()).slice(0, 180) || 'lorgnette row failed');
      const made = await ins.json();
      setRow(Array.isArray(made) ? made[0] : body);
      navigate('lorgnette', id);
    } catch (e: any) {
      setErr(e?.message || 'could not raise the glass');
    } finally {
      setBusy(false);
    }
  };

  const stampLook = async () => {
    if (!row?.id || stamped) return;
    setStamped(true);
    const next = Number(row.looks || 0) + 1;
    await fetch(`${SB_URL}/rest/v1/lorgnettes?id=eq.${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ looks: next }),
    }).catch(() => null);
    setRow({ ...row, looks: next });
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
          <p className="text-xs tracking-[0.18em] uppercase text-neutral-500 mb-3">viewing glass</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">Lorgnette</h1>
          <p className="text-neutral-400 max-w-xl mb-8 leading-relaxed">
            Not a drawer. One local file goes into the share database, with three marks for what to notice. The monocle board keeps the older glasses.
          </p>
        </motion.div>

        {row ? (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">looking for</p>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">{row.title}</h2>
                <p className="text-neutral-300 leading-relaxed">{row.looking_for}</p>
              </div>
              <span className="h-3 w-3 rounded-full mt-2 shrink-0" style={{ background: row.accent || '#0A84FF' }} />
            </div>
            {marks.length > 0 && (
              <ol className="mt-6 space-y-2">
                {marks.map((mark, i) => (
                  <li key={mark + i} className="flex gap-3 text-sm text-neutral-200">
                    <span className="text-neutral-500 tabular-nums">{i + 1}</span>
                    <span>{mark}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex items-center justify-between gap-3 py-3 mt-5 border-t border-white/10">
              <div>
                <p className="font-medium">{row.file_name || 'file'}</p>
                <p className="text-sm text-neutral-500">{pretty(Number(row.size) || 0)} · held {held}s · {Number(row.looks) || 0} looks</p>
              </div>
              {row.file_url && (
                <a href={row.file_url} className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium active:scale-[0.98] transition" download>
                  Download
                </a>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-full bg-white/10 px-4 py-2 text-sm active:scale-[0.98] transition" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button className="rounded-full bg-white/10 px-4 py-2 text-sm active:scale-[0.98] transition" onClick={stampLook}>
                {stamped ? 'Look stamped' : 'Stamp this look'}
              </button>
              <button className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={() => navigate('monocle')}>Open the board</button>
            </div>
            <p className="text-xs text-neutral-500 mt-4">Discord reads this link as a card. Large files were never refused.</p>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 sm:p-8">
            <label className="block text-sm text-neutral-400 mb-2">Title on the card</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="evening proof" className="w-full bg-white/5 rounded-2xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-white/20" />
            <label className="block text-sm text-neutral-400 mb-2">What the glass is for</label>
            <textarea value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} rows={3} placeholder="check the crop along the left edge" className="w-full bg-white/5 rounded-2xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-white/20" />
            <p className="text-sm text-neutral-400 mb-2">Three things to notice</p>
            <div className="space-y-2 mb-5">
              {notices.map((note, i) => (
                <input key={i} value={note} onChange={(e) => setNotices(notices.map((item, idx) => idx === i ? e.target.value : item))} placeholder={`mark ${i + 1}`} className="w-full bg-white/5 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/20" />
              ))}
            </div>
            <div className="flex gap-2 mb-5">
              {ACCENTS.map((c) => (
                <button key={c} aria-label={c} onClick={() => setAccent(c)} className="h-7 w-7 rounded-full transition" style={{ background: c, outline: accent === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
              ))}
            </div>
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center cursor-pointer hover:bg-white/5 transition-colors">
              <input type="file" className="hidden" onChange={(e) => onPick(e.target.files)} />
              <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'Drop a file from this computer'}</span>
            </label>
            {warn && <p className="text-sm text-amber-300 mt-3">{warn}</p>}
            {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
            <button disabled={busy} onClick={send} className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition">
              {busy ? 'Raising…' : 'Raise the glass'}
            </button>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
