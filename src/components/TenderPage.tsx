import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, publishLocalFile, type CloudMeta } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

type Reply = { id: string; body: string; author: string; at: string };
type Opened = {
  id: string;
  question: string;
  note: string;
  author: string;
  file: CloudMeta | null;
  replies: Reply[];
};

export default function TenderPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [made, setMade] = useState<string | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [reply, setReply] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');

  const slow = !!file && file.size > 12 * 1024 * 1024;

  async function load(id: string) {
    const res = await fetch(
      `${SB_URL}/rest/v1/tenders?id=eq.${encodeURIComponent(id)}&select=id,question,note,author,file_id,replies&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    const meta = row.file_id ? await fetchShare(row.file_id) : null;
    return {
      id: row.id,
      question: row.question || 'untitled question',
      note: row.note || '',
      author: row.author || '',
      file: meta,
      replies: Array.isArray(row.replies) ? row.replies : [],
    } as Opened;
  }

  useEffect(() => {
    if (!shareId) return;
    let stop = false;
    load(shareId).then((row) => {
      if (!stop) setOpened(row);
    });
    return () => {
      stop = true;
    };
  }, [shareId]);

  async function send() {
    setErr('');
    setWarn('');
    setMade(null);
    if (!file) return setErr('choose a local file');
    if (!question.trim()) return setErr('ask something short');
    setBusy(true);
    try {
      const pub = await publishLocalFile(file, {
        caption: question.trim(),
        author: author.trim(),
        color: '#0A84FF',
        cardTitle: file.name,
      });
      if (!pub.ok || !pub.id) throw new Error(pub.error || 'could not store the file');
      if (pub.warn) setWarn(pub.warn);
      const id = uid();
      const ins = await fetch(`${SB_URL}/rest/v1/tenders`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id,
          question: question.trim().slice(0, 280),
          note: note.trim() || null,
          author: author.trim() || null,
          file_id: pub.id,
          replies: [],
        }),
      });
      if (!ins.ok) throw new Error((await ins.text()).slice(0, 180) || 'tender table refused the row');
      const app = `${location.origin}/tender/${id}`;
      setMade(app);
      try {
        await navigator.clipboard.writeText(app);
      } catch {
        /* clipboard is optional */
      }
    } catch (e: any) {
      setErr(e?.message || 'could not send the tender');
    } finally {
      setBusy(false);
    }
  }

  async function addReply() {
    if (!opened || !reply.trim()) return;
    setErr('');
    const next: Reply = {
      id: uid(),
      body: reply.trim().slice(0, 500),
      author: replyAuthor.trim().slice(0, 80),
      at: new Date().toISOString(),
    };
    const replies = [...opened.replies, next];
    const res = await fetch(`${SB_URL}/rest/v1/tenders?id=eq.${encodeURIComponent(opened.id)}`, {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ replies }),
    });
    if (!res.ok) {
      setErr((await res.text()).slice(0, 160) || 'reply did not land');
      return;
    }
    setOpened({ ...opened, replies });
    setReply('');
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#0a84ff] mb-2">tender</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">a question with the file</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Hand one file from this machine and ask one thing. The bytes land in the share table. Replies stay on the tender, not in the vault. Discord unfurls /tender. Large files are warned, never refused.
          </p>
        </motion.div>

        {shareId && (
          <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 mb-6">
            {!opened && <p className="text-sm text-neutral-400">looking up that tender…</p>}
            {opened && (
              <>
                <h2 className="text-white font-medium mb-1">{opened.question}</h2>
                <p className="text-xs text-neutral-500 mb-3">{opened.author || 'unsigned'} · {opened.replies.length} replies</p>
                {opened.note && <p className="text-sm text-neutral-300 whitespace-pre-wrap mb-4">{opened.note}</p>}
                {opened.file ? (
                  <a className="text-sm text-[#0a84ff]" href={opened.file.url} rel="noreferrer">
                    {opened.file.name} · {prettySize(opened.file.size)}
                  </a>
                ) : (
                  <p className="text-xs text-neutral-500">file row not found yet</p>
                )}
                <ul className="mt-4 space-y-2">
                  {opened.replies.map((r) => (
                    <li key={r.id} className="rounded-2xl bg-white/[0.04] px-3 py-2">
                      <p className="text-sm text-neutral-200 whitespace-pre-wrap">{r.body}</p>
                      <p className="text-[11px] text-neutral-500 mt-1">{r.author || 'someone'} · {new Date(r.at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value.slice(0, 500))} placeholder="a short reply" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-20" />
                  <input value={replyAuthor} onChange={(e) => setReplyAuthor(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none" />
                  <button type="button" onClick={addReply} className="rounded-full bg-white text-black text-sm font-medium px-4 py-2 active:scale-[0.98] transition">leave a reply</button>
                </div>
              </>
            )}
          </motion.article>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5">
          <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center mb-3 cursor-pointer hover:border-white/30 transition-colors duration-200">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? file.name : 'choose one local file'}</span>
            {file && <span className="block text-xs text-neutral-500 mt-2">{prettySize(file.size)}</span>}
          </label>
          <input value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 280))} placeholder="what should they look at?" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-3" />
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 2000))} placeholder="context, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none min-h-24 mb-3" />
          <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 80))} placeholder="your name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none mb-4" />
          {slow && <p className="text-xs text-amber-300 mb-3">this file is large. sending may feel slow. there is no size cap.</p>}
          {warn && <p className="text-xs text-amber-300 mb-3">{warn}</p>}
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          {made && (
            <div className="text-xs text-neutral-300 mb-3 space-y-1">
              <p>copied the tender link</p>
              <button type="button" className="text-[#0a84ff] text-left break-all" onClick={() => navigate('tender', made.split('/').pop())}>{made}</button>
              <p className="text-neutral-500">paste it in Discord for a card. open questions sit on /gangway.</p>
            </div>
          )}
          <button type="button" disabled={busy} onClick={send} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5 disabled:opacity-50 active:scale-[0.98] transition">
            {busy ? 'sending…' : 'send the tender'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
