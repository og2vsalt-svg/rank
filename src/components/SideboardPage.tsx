import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Board = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  file_name: string | null;
  mime: string | null;
  size: number;
  file_url: string | null;
  share_id: string | null;
  created_at: string;
};

type Reply = { id: string; body: string; author: string | null; created_at: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function SideboardPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [board, setBoard] = useState<Board | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');

  const loadBoard = (id: string) => {
    sbRest(`sideboards?id=eq.${encodeURIComponent(id)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setBoard(Array.isArray(data) ? data[0] || null : null))
      .catch(() => {});
    sbRest(`sideboard_notes?sideboard_id=eq.${encodeURIComponent(id)}&select=id,body,author,created_at&order=created_at.asc&limit=80`)
      .then((r) => r.json())
      .then((data) => setReplies(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    if (shareId) loadBoard(shareId);
  }, [shareId]);

  const onFile = (list: FileList | null) => {
    const next = list && list[0] ? list[0] : null;
    setFile(next);
    setErr('');
    setLink('');
    setWarn(next && next.size > 25 * 1024 * 1024 ? 'large file. the tab may pause while it sends. nothing is refused.' : '');
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    const published = await publishLocalFile(file, {
      caption: note || title || undefined,
      author: author || undefined,
      cardTitle: title || file.name,
    });
    if (!published.ok || !published.url) {
      setBusy(false);
      setErr(published.error || 'could not store the file');
      return;
    }
    const id = published.id || Date.now().toString(36);
    const row = await sbRest('sideboards', {
      method: 'POST',
      body: JSON.stringify({
        id,
        title: title || file.name,
        note: note || null,
        author: author || null,
        file_name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        file_url: published.url,
        share_id: published.id || null,
      }),
    });
    setBusy(false);
    if (!row.ok) {
      setErr((await row.text()).slice(0, 180));
      return;
    }
    const href = `${window.location.origin}/sideboard/${id}`;
    setLink(href);
    setFile(null);
    setTitle('');
    setNote('');
    loadBoard(id);
    history.pushState(null, '', `/sideboard/${id}`);
  };

  const addReply = async () => {
    if (!board || !reply.trim()) return;
    setBusy(true);
    const res = await sbRest('sideboard_notes', {
      method: 'POST',
      body: JSON.stringify({ sideboard_id: board.id, body: reply.trim().slice(0, 500), author: replyAuthor || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180));
      return;
    }
    setReply('');
    loadBoard(board.id);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">shared table</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">Sideboard</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">One local file goes into the share table, then a sideboard row keeps the note and the replies. This is a conversation around a file, not another drawer in the vault. Large files get a slowness note, not a ceiling. Paste /sideboard/id in Discord for a card.</p>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-center transition duration-200 hover:border-white/30 hover:-translate-y-0.5">
            <span className="text-[15px] font-medium">{file ? file.name : 'Choose a file from this computer'}</span>
            <span className="mt-1 text-[13px] text-white/45">{file ? pretty(file.size) : 'any size, any type'}</span>
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
          </label>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what is on the table" className="mt-4 w-full rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 transition focus:ring-[#0A84FF]" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="mt-3 w-full rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 transition focus:ring-[#0A84FF]" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="why you are putting it out" rows={3} className="mt-3 w-full resize-none rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 transition focus:ring-[#0A84FF]" />
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition duration-200 hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-40">{busy ? 'setting the table…' : 'share the file'}</button>
          {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
          {link && <p className="mt-3 break-all text-[13px] text-[#7ec8ff]"><a href={link}>{link}</a></p>}
        </motion.section>
        {board && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">on the table</p>
            <h2 className="mt-1 text-xl font-medium">{board.title}</h2>
            {board.note && <p className="mt-2 text-[15px] text-white/75">{board.note}</p>}
            <p className="mt-2 text-[12px] text-white/40">{board.author || 'unsigned'} · {pretty(Number(board.size) || 0)}</p>
            {board.file_url && (
              <a href={board.file_url} className="mt-4 flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3 text-[14px] transition hover:bg-black/50">
                <span>{board.file_name || 'file'}</span>
                <span className="text-[12px] text-white/40">open</span>
              </a>
            )}
            <div className="mt-5 space-y-2">
              {replies.map((item) => (
                <div key={item.id} className="rounded-2xl bg-black/25 px-4 py-3">
                  <p className="text-[14px] leading-relaxed">{item.body}</p>
                  <p className="mt-1 text-[12px] text-white/40">{item.author || 'someone at the table'}</p>
                </div>
              ))}
              {replies.length === 0 && <p className="text-[13px] text-white/40">No replies yet.</p>}
            </div>
            <input value={replyAuthor} onChange={(e) => setReplyAuthor(e.target.value)} placeholder="your name" className="mt-4 w-full rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="leave a short reply" rows={2} className="mt-3 w-full resize-none rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
            <button onClick={addReply} disabled={!reply.trim() || busy} className="mt-3 rounded-full bg-white/10 px-4 py-2 text-[13px] transition hover:bg-white/15 disabled:opacity-40">add reply</button>
          </motion.section>
        )}
      </main>
    </div>
  );
}
