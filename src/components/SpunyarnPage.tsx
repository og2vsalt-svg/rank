import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishLocalFile, shareUrls } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

const ACCENTS = ['#64D2FF', '#0A84FF', '#30D158', '#FFD60A', '#FF9F0A', '#BF5AF2', '#FF375F'];

type Yarn = {
  id: string;
  share_id: string | null;
  note: string;
  accent: string;
  author: string | null;
  file_name: string | null;
};

function rid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function saveYarn(row: Yarn) {
  const res = await fetch(`${SB_URL}/rest/v1/spunyarns`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'yarn save failed');
}

async function loadYarn(id: string): Promise<Yarn | null> {
  const res = await fetch(
    `${SB_URL}/rest/v1/spunyarns?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function SpunyarnPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [made, setMade] = useState<{ id: string; share: string; app: string } | null>(null);
  const [opened, setOpened] = useState<Yarn | null>(null);
  const [preview, setPreview] = useState('');

  const slow = useMemo(() => !!file && file.size > 8 * 1024 * 1024, [file]);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    loadYarn(shareId).then(async (row) => {
      if (stop || !row) return;
      setOpened(row);
      if (row.share_id) {
        const share = await fetchShare(row.share_id);
        if (!stop && share?.url) setPreview(share.url);
      }
    });
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function send() {
    setErr('');
    setWarn('');
    if (!file) {
      setErr('choose a local file first');
      return;
    }
    setBusy(true);
    try {
      const pub = await publishLocalFile(file, {
        caption: note,
        author,
        color: accent,
        cardTitle: file.name,
      });
      if (!pub.ok || !pub.id) throw new Error(pub.error || 'share failed');
      if (pub.warn) setWarn(pub.warn);
      const id = rid();
      await saveYarn({
        id,
        share_id: pub.id,
        note: note.trim(),
        accent,
        author: author.trim() || null,
        file_name: file.name,
      });
      const urls = shareUrls(pub.id);
      const app = `${location.origin}/spunyarn/${id}`;
      setMade({ id, share: urls.app, app });
      try { await navigator.clipboard.writeText(app); } catch { /* clipboard is optional */ }
    } catch (e: any) {
      setErr(e?.message || 'could not file the yarn');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#64d2ff] mb-2">spunyarn</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a yarn, not a drawer</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Tie a short note to a file from this machine. The bytes land in the share table. Discord unfurls this link. Nothing is refused for size — only a warning if the drop may feel slow.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-6" style={{ borderColor: opened.accent }}>
            <p className="text-xs text-neutral-500 mb-1">{opened.author || 'unsigned'}</p>
            <h2 className="text-white font-medium mb-2">{opened.file_name || 'file'}</h2>
            <p className="text-sm text-neutral-300 whitespace-pre-wrap">{opened.note || 'no note'}</p>
            {preview && <a className="inline-block mt-4 text-sm text-[#64d2ff]" href={preview}>open the file</a>}
          </motion.article>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-5">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center mb-3 cursor-pointer hover:border-white/30">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? file.name : 'drop a local file, or click to choose'}</span>
            {file && <span className="block text-xs text-neutral-500 mt-2">{Math.max(1, Math.round(file.size / 1024))} KB</span>}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 2000))}
            placeholder="what this yarn is for"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-24 mb-3"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value.slice(0, 80))}
            placeholder="your name, optional"
            className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-4"
          />
          <div className="flex gap-2 mb-5">
            {ACCENTS.map((c) => (
              <button key={c} type="button" aria-label={c} onClick={() => setAccent(c)} className="h-7 w-7 rounded-full" style={{ background: c, outline: accent === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          {slow && <p className="text-xs text-amber-300 mb-3">this one is large. sending may feel slow. there is no size cap.</p>}
          {warn && <p className="text-xs text-amber-200/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-300 mb-3">{err}</p>}
          <button type="button" disabled={busy} onClick={send} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50">
            {busy ? 'spinning…' : 'spin the yarn'}
          </button>
          {made && (
            <div className="mt-5 text-sm">
              <p className="text-neutral-400 mb-1">copied. discord card lives on this link:</p>
              <button type="button" className="text-[#64d2ff] break-all text-left" onClick={() => navigate('spunyarn', made.id)}>{made.app}</button>
              <p className="text-neutral-500 mt-2 break-all">file card: {made.share}</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
