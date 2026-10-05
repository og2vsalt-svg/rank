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

const ACCENTS = ['#0A84FF', '#64D2FF', '#30D158', '#FFD60A', '#FF9F0A', '#BF5AF2', '#FF375F'];

type Ribbon = {
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

async function saveRibbon(row: Ribbon) {
  const res = await fetch(`${SB_URL}/rest/v1/ribbons`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'ribbon save failed');
}

async function loadRibbon(id: string): Promise<Ribbon | null> {
  const res = await fetch(
    `${SB_URL}/rest/v1/ribbons?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function RibbonPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [made, setMade] = useState<{ id: string; share: string; app: string } | null>(null);
  const [opened, setOpened] = useState<Ribbon | null>(null);
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    (async () => {
      const row = await loadRibbon(shareId);
      if (stop || !row) return;
      setOpened(row);
      setAccent(row.accent || ACCENTS[0]);
      if (row.share_id) {
        const meta = await fetchShare(row.share_id);
        if (!stop && meta?.url) setPreview(meta.url);
      }
    })();
    return () => {
      stop = true;
    };
  }, [shareId]);

  const slow = useMemo(() => (file && file.size > 40 * 1024 * 1024 ? true : false), [file]);

  const send = async () => {
    if (!file) {
      setErr('pick a local file first');
      return;
    }
    setBusy(true);
    setErr('');
    setWarn(slow ? 'chunky file. the tab may feel slow while it sends. nothing is refused.' : '');
    try {
      const pub = await publishLocalFile(file, {
        caption: note.trim(),
        author: author.trim() || undefined,
        color: accent,
        cardTitle: file.name,
      });
      if (!pub.ok || !pub.id) {
        setErr(pub.error || 'upload failed');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const id = rid();
      await saveRibbon({
        id,
        share_id: pub.id,
        note: note.trim(),
        accent,
        author: author.trim() || null,
        file_name: file.name,
      });
      const urls = shareUrls(pub.id);
      const app = `${location.origin}/ribbon/${id}`;
      setMade({ id, share: urls.app, app });
      try { await navigator.clipboard.writeText(app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'could not file the ribbon');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 apple-in"
        >
          <p className="text-sm mb-2" style={{ color: accent }}>ribbon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a colored receipt, not a drawer.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            The file lands in the share table. The note and accent live beside it. Paste the link in Discord and the card unfurls. Large files are warned, never refused.
          </p>

          {opened && (
            <div className="mb-6 rounded-[24px] border border-white/10 p-5" style={{ boxShadow: `inset 3px 0 0 ${opened.accent || accent}` }}>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500 mb-2">opened ribbon</p>
              <p className="text-lg font-medium">{opened.file_name || 'file'}</p>
              <p className="text-neutral-300 text-sm mt-2 whitespace-pre-wrap">{opened.note || 'no note'}</p>
              {opened.author && <p className="text-xs text-neutral-500 mt-2">from {opened.author}</p>}
              {preview && (
                <a href={preview} className="inline-block mt-4 text-sm text-[#64d2ff]">open the file</a>
              )}
            </div>
          )}

          <label
            className="lift block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-8 text-center mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span className="text-sm text-neutral-300">{file ? file.name : 'drop a local file, or click to choose'}</span>
            {file && <span className="block text-xs text-neutral-500 mt-2">{Math.max(1, Math.round(file.size / 1024))} KB</span>}
          </label>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 2000))}
            placeholder="a short handling note"
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
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setAccent(c)}
                className="h-7 w-7 rounded-full"
                style={{ background: c, outline: accent === c ? '2px solid white' : 'none', outlineOffset: 2 }}
              />
            ))}
          </div>
          {slow && <p className="text-xs text-amber-300 mb-3">this one is large. sending may feel slow. there is no size cap.</p>}
          {warn && <p className="text-xs text-amber-200/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-300 mb-3">{err}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={send}
            className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'sending…' : 'file the ribbon'}
          </button>
          {made && (
            <div className="mt-5 text-sm">
              <p className="text-neutral-400 mb-1">copied. discord card lives on this link:</p>
              <button type="button" className="text-[#64d2ff] break-all text-left" onClick={() => navigate('ribbon', made.id)}>{made.app}</button>
              <p className="text-neutral-500 mt-2 break-all">file card: {made.share}</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
