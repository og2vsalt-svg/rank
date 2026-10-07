import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Slip = {
  id: string;
  title: string;
  for_whom: string | null;
  note: string | null;
  author: string | null;
  file_name: string;
  mime: string | null;
  size: number;
  file_url: string;
  share_id: string | null;
  received_at: string | null;
  received_by: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function BilletPage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Slip | null>(null);
  const [recent, setRecent] = useState<Slip[]>([]);

  const size = useMemo(() => file?.size || 0, [file]);

  const load = () => {
    sbRest('billets?select=*&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`billets?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setOpen(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setOpen(null));
  }, [shareId]);

  const onFile = (list: FileList | null) => {
    const next = list && list[0] ? list[0] : null;
    setFile(next);
    setErr('');
    setLink('');
    setWarn(next && next.size > 25 * 1024 * 1024 ? 'large slip. the tab may pause while it sends. nothing is refused.' : '');
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
    const row = await sbRest('billets', {
      method: 'POST',
      body: JSON.stringify({
        id,
        title: title || file.name,
        for_whom: forWhom || null,
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
    setLink(`${window.location.origin}/billet/${id}`);
    setFile(null);
    setTitle('');
    setNote('');
    setForWhom('');
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">delivery slip</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">Billet</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">One local file, a name on the envelope, and a note. The bytes go to storage, then a row lands in the billets table. Someone can mark it received on ack. Large slips get a slowness note, not a ceiling. Paste /billet/id in Discord for a card.</p>

        {open && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">{open.received_at ? 'received' : 'waiting'}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.title}</h2>
            <p className="mt-2 text-sm text-white/60">{open.for_whom ? `for ${open.for_whom}` : 'no name on the envelope'}{open.author ? ` · from ${open.author}` : ''}</p>
            {open.note && <p className="mt-3 text-[15px] leading-relaxed text-white/80">{open.note}</p>}
            <a href={open.file_url} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0a84ff] px-4 py-2 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.02]">{open.file_name} · {pretty(Number(open.size) || 0)}</a>
          </motion.section>
        )}

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <label className="block text-sm text-white/70">
            file
            <input type="file" onChange={(e) => onFile(e.target.files)} className="mt-2 block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white" />
          </label>
          {file && <p className="mt-2 text-sm text-white/50">{file.name} · {pretty(size)}</p>}
          {warn && <p className="mt-2 text-sm text-amber-200/80">{warn}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="slip title" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={forWhom} onChange={(e) => setForWhom(e.target.value)} placeholder="for whom" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note on the slip" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#0a84ff]" />
          </div>
          <button disabled={!file || busy} onClick={send} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.02] disabled:opacity-40">{busy ? 'sending…' : 'file the slip'}</button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && <p className="mt-3 text-sm text-white/70">card link <a className="text-[#0a84ff]" href={link}>{link}</a></p>}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">recent slips</h2>
            <button onClick={() => navigate('ack')} className="text-sm text-[#0a84ff]">open ack</button>
          </div>
          <ul className="mt-3 space-y-2">
            {recent.map((row) => (
              <li key={row.id}>
                <button onClick={() => navigate('billet', row.id)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]">
                  <span>
                    <span className="block text-sm font-medium">{row.title}</span>
                    <span className="text-xs text-white/45">{row.file_name} · {pretty(Number(row.size) || 0)}</span>
                  </span>
                  <span className="text-xs text-white/40">{row.received_at ? 'received' : 'open'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
