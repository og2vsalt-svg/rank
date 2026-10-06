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

const ACCENTS = ['#0A84FF', '#64D2FF', '#30D158', '#FF9F0A', '#BF5AF2'];

type Row = {
  id: string;
  share_id: string;
  title: string;
  recipient: string | null;
  note: string;
  author: string | null;
  accent: string | null;
};

function rid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function saveRow(row: Row) {
  const res = await fetch(`${SB_URL}/rest/v1/handoffs`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'handoff save failed');
}

async function loadRow(id: string): Promise<Row | null> {
  const res = await fetch(`${SB_URL}/rest/v1/handoffs?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export default function HandoffPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [made, setMade] = useState<{ app: string; file: string } | null>(null);
  const [opened, setOpened] = useState<Row | null>(null);
  const [fileUrl, setFileUrl] = useState('');

  const slow = useMemo(() => !!file && file.size > 12 * 1024 * 1024, [file]);

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    loadRow(shareId).then(async (row) => {
      if (stop || !row) return;
      setOpened(row);
      if (row.share_id) {
        const share = await fetchShare(row.share_id);
        if (!stop && share?.url) setFileUrl(share.url);
      }
    });
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function send() {
    setErr('');
    setWarn('');
    if (!file) return setErr('choose a local file first');
    if (!recipient.trim()) return setErr('who is this for?');
    setBusy(true);
    try {
      const pub = await publishLocalFile(file, {
        caption: note,
        author,
        color: accent,
        cardTitle: `for ${recipient.trim()}`,
      });
      if (!pub.ok || !pub.id) throw new Error(pub.error || 'share failed');
      if (pub.warn) setWarn(pub.warn);
      const id = rid();
      await saveRow({
        id,
        share_id: pub.id,
        title: recipient.trim(),
        recipient: recipient.trim(),
        note: note.trim(),
        author: author.trim() || null,
        accent,
      });
      const app = `${location.origin}/handoff/${id}`;
      setMade({ app, file: shareUrls(pub.id).embed });
      try { await navigator.clipboard.writeText(app); } catch { /* clipboard is optional */ }
    } catch (e: any) {
      setErr(e?.message || 'could not file the handoff');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#0a84ff] mb-2">handoff</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a file with a name on it</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Pick someone, attach a file from this machine, and the bytes land in the share table. The link is a delivery note, not a drawer in the vault. Discord unfurls it. Large files are warned, never turned away.
          </p>
        </motion.div>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-6">
            <p className="text-xs text-neutral-500 mb-1">for {opened.recipient || opened.title}</p>
            <h2 className="text-white font-medium mb-2">{opened.author || 'unsigned'}</h2>
            <p className="text-sm text-neutral-300 whitespace-pre-wrap">{opened.note || 'no note'}</p>
            {fileUrl && (
              <a className="inline-block mt-4 text-sm text-[#64d2ff]" href={fileUrl}>open the file</a>
            )}
          </motion.article>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-3xl p-5">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center mb-3 cursor-pointer hover:border-white/30 transition-colors">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? file.name : 'choose a local file'}</span>
            {file && <span className="block text-xs text-neutral-500 mt-2">{Math.max(1, Math.round(file.size / 1024))} KB</span>}
          </label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value.slice(0, 80))} placeholder="who it is for" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-3" />
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 2000))} placeholder="a line they should see first" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-24 mb-3" />
          <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-4" />
          <div className="flex gap-2 mb-5">
            {ACCENTS.map((c) => (
              <button key={c} type="button" aria-label={c} onClick={() => setAccent(c)} className="h-7 w-7 rounded-full transition-transform active:scale-95" style={{ background: c, outline: accent === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          {slow && <p className="text-xs text-amber-300 mb-3">this one is large. sending may feel slow. there is no size cap.</p>}
          {warn && <p className="text-xs text-amber-300 mb-3">{warn}</p>}
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          {made && (
            <div className="text-xs text-neutral-300 mb-3 space-y-1">
              <p>copied the handoff link</p>
              <button type="button" className="text-[#64d2ff]" onClick={() => navigate('handoff', made.app.split('/').pop())}>{made.app}</button>
              <p className="text-neutral-500">file card: {made.file}</p>
            </div>
          )}
          <button type="button" disabled={busy} onClick={send} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
            {busy ? 'filing…' : 'file the handoff'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
