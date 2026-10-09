import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';
const SLOW = 12 * 1024 * 1024;

type OpenAs = 'preview' | 'download' | 'both';
type Row = {
  id: string;
  label: string;
  instruction?: string | null;
  open_as?: OpenAs | null;
  author?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime?: string | null;
  size?: number | null;
  share_id?: string | null;
  copies?: number | null;
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
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function ModillionPage() {
  const { shareId, navigate } = useRouter();
  const [label, setLabel] = useState('');
  const [instruction, setInstruction] = useState('');
  const [author, setAuthor] = useState('');
  const [openAs, setOpenAs] = useState<OpenAs>('both');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);
  const [copied, setCopied] = useState(false);
  const slow = useMemo(() => (file && file.size > SLOW ? `about ${pretty(file.size)}. the bracket may take a moment to set. nothing is refused.` : ''), [file]);

  useEffect(() => {
    if (!shareId) {
      fetch(`${SB_URL}/rest/v1/modillion_brackets?select=id,label,instruction,open_as,author,file_name,size,copies,created_at&order=created_at.desc&limit=6`, { headers: headers() })
        .then((r) => r.json())
        .then((rows) => setRecent(Array.isArray(rows) ? rows : []))
        .catch(() => setRecent([]));
      return;
    }
    fetch(`${SB_URL}/rest/v1/modillion_brackets?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`, { headers: headers() })
      .then((r) => r.json())
      .then((rows) => setRow(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  async function setBracket(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !label.trim()) {
      setError('a label and a local file.');
      return;
    }
    setBusy(true);
    setError('');
    const published = await publishLocalFile(file, { caption: instruction, author, cardTitle: label.trim(), meta: { desk: 'modillion', openAs } });
    if (!published.ok || !published.url) {
      setBusy(false);
      setError(published.error || 'could not file that. try again.');
      return;
    }
    const id = uid();
    const res = await fetch(`${SB_URL}/rest/v1/modillion_brackets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        id,
        label: label.trim(),
        instruction: instruction.trim(),
        open_as: openAs,
        author: author.trim() || null,
        file_name: file.name,
        file_url: published.url,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        share_id: published.id || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('the file landed, the bracket note did not. try again.');
      return;
    }
    navigate('modillion', id);
  }

  async function copyLink() {
    if (!row) return;
    const link = `${location.origin}/modillion/${row.id}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
    fetch(`${SB_URL}/rest/v1/modillion_brackets?id=eq.${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ copies: (row.copies || 0) + 1 }),
    }).catch(() => {});
    setRow({ ...row, copies: (row.copies || 0) + 1 });
  }

  const showPreview = row && (row.open_as === 'preview' || row.open_as === 'both') && String(row.mime || '').startsWith('image/');
  const showDownload = !row || row.open_as !== 'preview';

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Navbar />
      <main className="mx-auto max-w-[760px] px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.18em] text-[#6e6e73]">
          handoff bracket
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-[40px] font-semibold tracking-[-0.04em]">
          modillion
        </motion.h1>
        <p className="mt-3 max-w-[46ch] text-[17px] leading-relaxed text-[#6e6e73]">
          Not a drawer. A small bracket under the cornice: one local file, a one-line instruction, and how the next person should open it.
        </p>

        {shareId && row && (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <p className="text-[13px] text-[#6e6e73]">{row.author || 'unsigned'} · {(row.copies || 0)} copies</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">{row.label}</h2>
            {row.instruction && <p className="mt-3 text-[17px] leading-relaxed">{row.instruction}</p>}
            <p className="mt-4 text-[13px] text-[#6e6e73]">{row.file_name} · {pretty(row.size || 0)} · opens as {row.open_as || 'both'}</p>
            {showPreview && row.file_url && (
              <img src={row.file_url} alt="" className="mt-5 max-h-[420px] w-full rounded-2xl object-contain bg-[#f5f5f7]" />
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {showDownload && row.file_url && (
                <a href={row.file_url} className="rounded-full bg-[#1d1d1f] px-4 py-2 text-[14px] text-white" download={row.file_name || undefined}>open file</a>
              )}
              <button onClick={copyLink} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-[14px]">{copied ? 'copied' : 'copy link'}</button>
            </div>
            <p className="mt-4 text-[12px] text-[#6e6e73]">Paste this link in Discord for a card. Large files are warned, never refused.</p>
          </motion.article>
        )}

        {shareId && !row && <p className="mt-10 text-[15px] text-[#6e6e73]">that bracket is not on the shelf.</p>}

        {!shareId && (
          <motion.form onSubmit={setBracket} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="one line for the next person" className="h-24 w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="w-full rounded-2xl bg-[#f5f5f7] px-4 py-3 text-[16px] outline-none" />
            <div className="flex gap-2">
              {(['preview', 'download', 'both'] as OpenAs[]).map((mode) => (
                <button type="button" key={mode} onClick={() => setOpenAs(mode)} className={`rounded-full px-3.5 py-1.5 text-[13px] ${openAs === mode ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`}>{mode}</button>
              ))}
            </div>
            <label className="block cursor-pointer rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-[15px] text-[#6e6e73]">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? file.name : 'choose a local file'}
            </label>
            {slow && <p className="text-[13px] text-[#b25000]">{slow}</p>}
            {error && <p className="text-[13px] text-[#ff3b30]">{error}</p>}
            <button disabled={busy} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[15px] font-medium text-white disabled:opacity-50">
              {busy ? 'setting…' : 'set the bracket'}
            </button>
          </motion.form>
        )}

        {!shareId && recent.length > 0 && (
          <section className="mt-10">
            <h3 className="text-[13px] uppercase tracking-[0.16em] text-[#6e6e73]">already set</h3>
            <div className="mt-3 grid gap-2">
              {recent.map((item) => (
                <button key={item.id} onClick={() => navigate('modillion', item.id)} className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm">
                  <span className="block text-[15px] font-medium">{item.label}</span>
                  <span className="text-[13px] text-[#6e6e73]">{item.instruction || item.file_name}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
