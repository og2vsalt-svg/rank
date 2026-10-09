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
  room: string;
  line?: string | null;
  echo?: string | null;
  author?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
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

export default function SoffitPage() {
  const { shareId, navigate } = useRouter();
  const [room, setRoom] = useState('');
  const [line, setLine] = useState('');
  const [author, setAuthor] = useState('');
  const [echo, setEcho] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the panel may take a moment. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${SB_URL}/rest/v1/soffit_panels?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => {
        const next = Array.isArray(rows) ? rows[0] || null : null;
        setRow(next);
        setEcho(next?.echo || '');
      })
      .catch(() => setRow(null));
  }, [shareId]);

  async function pin() {
    if (!file || !room.trim()) {
      setError('a room name and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const published = await publishLocalFile(file, {
        caption: line.trim() || room.trim(),
        author: author.trim(),
        cardTitle: room.trim(),
        color: '#0A84FF',
        meta: { desk: 'soffit' },
      });
      if (!published.ok || !published.id) throw new Error(published.error || 'upload failed');
      const saved = await fetch(`${SB_URL}/rest/v1/soffit_panels`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          id: published.id,
          room: room.trim(),
          line: line.trim() || null,
          author: author.trim() || null,
          file_name: file.name,
          file_url: published.url,
          mime: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 180));
      const rows = await saved.json();
      setRow(rows[0] || null);
      navigate('soffit', published.id);
    } catch (e: any) {
      setError(e?.message || 'could not set the panel');
    } finally {
      setBusy(false);
    }
  }

  async function saveEcho() {
    if (!row) return;
    setBusy(true);
    setError('');
    try {
      const saved = await fetch(`${SB_URL}/rest/v1/soffit_panels?id=eq.${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ echo: echo.trim() || null }),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 180));
      const rows = await saved.json();
      setRow(rows[0] || { ...row, echo: echo.trim() });
    } catch (e: any) {
      setError(e?.message || 'could not leave the echo');
    } finally {
      setBusy(false);
    }
  }

  const link = row ? `${location.origin}/soffit/${row.id}` : '';
  const image = row && String(row.mime || '').startsWith('image/') ? row.file_url : '';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-wide text-[#6e6e73]">soffit</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-tight">a panel overhead</motion.h1>
        <p className="mt-3 text-[17px] leading-relaxed text-[#6e6e73]">Not a drawer. Pin one local file to a ceiling panel, leave a line, and let someone echo it. Discord unfurls the link.</p>
        {row ? (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-10 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <div className="aspect-[16/9] bg-[#e8e8ed]">
              {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[15px] text-[#6e6e73]">{row.file_name}</div>}
            </div>
            <div className="p-6">
              <h2 className="text-[22px] font-semibold tracking-tight">{row.room}</h2>
              {row.line && <p className="mt-2 text-[16px] leading-relaxed text-[#3a3a3c]">{row.line}</p>}
              <p className="mt-3 text-[13px] text-[#6e6e73]">{row.file_name}{row.size ? ` · ${pretty(row.size)}` : ''}{row.author ? ` · ${row.author}` : ''}</p>
              <label className="mt-5 block text-[13px] text-[#6e6e73]">echo under the panel</label>
              <input value={echo} onChange={(e) => setEcho(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" placeholder="a reply, no new file" />
              <div className="mt-5 flex flex-wrap gap-2">
                {row.file_url && <a href={row.file_url} className="rounded-full bg-[#0A84FF] px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#0071e3]">open file</a>}
                <button onClick={saveEcho} disabled={busy} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] text-white disabled:opacity-60">{busy ? 'saving…' : 'leave echo'}</button>
                <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">{copied ? 'copied' : 'copy card link'}</button>
              </div>
              {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
            </div>
          </motion.section>
        ) : (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <label className="block text-[13px] text-[#6e6e73]">room under the panel</label>
            <input value={room} onChange={(e) => setRoom(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="west study" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">line on the panel</label>
            <textarea value={line} onChange={(e) => setLine(e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="what the file is holding up" />
            <label className="mt-4 block text-[13px] text-[#6e6e73]">signed</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none focus:bg-white focus:shadow-[0_0_0_1px_#d2d2d7]" placeholder="optional" />
            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#d2d2d7] px-4 py-4 text-[15px] transition hover:bg-[#fafafa]">
              <span>{file ? file.name : 'local file'}</span>
              <span className="text-[13px] text-[#6e6e73]">{file ? pretty(file.size) : 'any size'}</span>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {slow && <p className="mt-2 text-[13px] text-[#a15c07]">{slow}</p>}
            {error && <p className="mt-2 text-[13px] text-[#ff375f]">{error}</p>}
            <button disabled={busy} onClick={pin} className="mt-5 rounded-full bg-[#0A84FF] px-5 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0071e3] disabled:opacity-60">{busy ? 'setting…' : 'set the panel'}</button>
          </motion.section>
        )}
      </main>
      <Footer />
    </div>
  );
}
