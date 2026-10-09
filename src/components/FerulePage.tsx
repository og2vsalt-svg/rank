import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type Row = {
  id: string;
  name?: string | null;
  caption?: string | null;
  author?: string | null;
  mime?: string | null;
  size?: number | null;
  file_url?: string | null;
  meta?: { kind?: string; question?: string; parent?: string } | null;
};

function pretty(n: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function headers() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}

export default function FerulePage() {
  const { shareId, navigate } = useRouter();
  const [question, setQuestion] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [replies, setReplies] = useState<Row[]>([]);
  const [answer, setAnswer] = useState('');
  const [who, setWho] = useState('');
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the pointer may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/public_shares?id=eq.${encodeURIComponent(shareId)}&select=id,name,caption,author,mime,size,file_url,meta&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
    fetch(`${SB_URL}/rest/v1/public_shares?meta->>parent=eq.${encodeURIComponent(shareId)}&select=id,name,caption,author,file_url,meta&order=created_at.asc&limit=40`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setReplies(Array.isArray(rows) ? rows : []))
      .catch(() => setReplies([]));
  }, [shareId]);

  async function raise() {
    if (!file || !question.trim()) {
      setError('a question and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: question.trim(),
        author: author.trim() || undefined,
        cardTitle: question.trim().slice(0, 80),
        meta: { kind: 'ferule', question: question.trim() },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'the file did not land');
      navigate('ferule', published.id);
    } catch (e: any) {
      setError(e?.message || 'could not raise the pointer');
    } finally {
      setBusy(false);
    }
  }

  async function reply() {
    if (!row || !answer.trim()) return;
    setBusy(true);
    setError('');
    try {
      const blob = new File([answer.trim()], 'answer.txt', { type: 'text/plain' });
      const published = await publishLocalFile(blob, {
        caption: answer.trim(),
        author: who.trim() || undefined,
        cardTitle: 'reply',
        meta: { kind: 'ferule-reply', parent: row.id },
      });
      if (!published.ok) throw new Error(published.error || 'reply did not land');
      setAnswer('');
      setReplies((prev) => [...prev, { id: published.id || '', caption: answer.trim(), author: who.trim(), name: 'reply' }]);
    } catch (e: any) {
      setError(e?.message || 'could not leave the answer');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${location.origin}/ferule/${row.id}` : '';
  const image = row && String(row.mime || '').startsWith('image/') ? row.file_url : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">ferule</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">a pointer, not a drawer</motion.h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">File one local lesson into the share table, ask a question, and let someone answer without uploading a second cabinet. Discord unfurls /ferule. Large drops are warned, never refused.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-4">
            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#1d1d1f]">
                {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-6 text-center text-[15px] text-white/70">{row.name}</div>}
              </div>
              <div className="p-6">
                <h2 className="text-[26px] font-semibold tracking-tight">{row.meta?.question || row.caption}</h2>
                <p className="mt-2 text-[13px] text-[#6e6e73]">{row.author || 'unsigned'} · {pretty(Number(row.size) || 0)}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {row.file_url && <a href={row.file_url} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] font-medium text-white transition active:scale-[0.98]">open lesson</a>}
                  <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px] transition active:scale-[0.98]">{copied ? 'copied' : 'copy card link'}</button>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
              <p className="text-[13px] text-[#6e6e73]">answers already on the desk</p>
              <ul className="mt-3 space-y-3">
                {replies.length === 0 && <li className="text-[15px] text-[#6e6e73]">none yet.</li>}
                {replies.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-[#f5f5f7] px-4 py-3">
                    <p className="text-[15px]">{r.caption}</p>
                    <p className="mt-1 text-[12px] text-[#6e6e73]">{r.author || 'unsigned'}</p>
                  </li>
                ))}
              </ul>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="an answer, no second file required" rows={3} className="mt-4 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
              <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="your name" className="mt-3 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
              {error && <p className="mt-3 text-[13px] text-[#c93400]">{error}</p>}
              <button disabled={busy} onClick={reply} className="mt-4 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60">{busy ? 'leaving…' : 'leave the answer'}</button>
            </div>
          </motion.section>
        ) : (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} onSubmit={(e) => { e.preventDefault(); raise(); }} className="mt-10 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="the question the file is pointing at" rows={3} className="w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, if you want it" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <label className="block rounded-2xl border border-dashed border-black/10 px-4 py-5 text-[14px] text-[#6e6e73]">
              <input type="file" className="block w-full text-[14px] text-[#1d1d1f]" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="mt-2 block">any local file. no size cap.</span>
            </label>
            {slow && <p className="text-[13px] text-[#c93400]">{slow}</p>}
            {error && <p className="text-[13px] text-[#c93400]">{error}</p>}
            <button disabled={busy} className="rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition active:scale-[0.98] disabled:opacity-60">{busy ? 'raising…' : 'raise the pointer'}</button>
          </motion.form>
        )}
      </main>
      <Footer />
    </div>
  );
}
