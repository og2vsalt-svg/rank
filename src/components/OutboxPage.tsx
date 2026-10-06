import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Drop = {
  id: string;
  name: string;
  mime: string | null;
  size: number;
  file_url: string;
  note: string | null;
  sent_to: string | null;
  author: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function OutboxPage() {
  const { shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [author, setAuthor] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [focus, setFocus] = useState<Drop | null>(null);

  const sizeLabel = useMemo(() => (file ? pretty(file.size) : ''), [file]);

  const load = () => {
    sbRest('outbox_drops?select=id,name,mime,size,file_url,note,sent_to,author,created_at&order=created_at.desc&limit=40')
      .then((r) => r.json())
      .then((data) => setDrops(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`outbox_drops?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setFocus(Array.isArray(data) ? data[0] || null : null))
      .catch(() => {});
  }, [shareId]);

  const onFile = (next: File | null) => {
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
      caption: note || undefined,
      author: author || undefined,
      cardTitle: file.name,
    });
    if (!published.ok || !published.id) {
      setBusy(false);
      setErr(published.error || 'could not store the file');
      return;
    }
    const row = {
      id: published.id,
      name: file.name || 'file',
      mime: file.type || 'application/octet-stream',
      size: file.size,
      file_url: published.url || '',
      note: note || null,
      sent_to: sentTo || null,
      author: author || null,
    };
    const ins = await sbRest('outbox_drops', { method: 'POST', body: JSON.stringify(row) });
    setBusy(false);
    if (!ins.ok) {
      const text = await ins.text();
      setErr(`saved the file, but the outbox row failed: ${text.slice(0, 160)}`);
      return;
    }
    const origin = window.location.origin;
    setLink(`${origin}/outbox/${published.id}`);
    setFile(null);
    setNote('');
    load();
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          send desk
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight">
          Outbox
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          A local file goes into storage and a row in the outbox table. Older vaults stay put. Large drops get a slowness note, not a ceiling. Paste the link in Discord for a card.
        </p>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.08 }}
          className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        >
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 px-6 py-10 text-center transition hover:border-white/30">
            <span className="text-[15px] font-medium">{file ? file.name : 'Choose a file from this computer'}</span>
            <span className="mt-1 text-[13px] text-white/45">{file ? sizeLabel : 'any size, any type'}</span>
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          </label>
          {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={sentTo} onChange={(e) => setSentTo(e.target.value)} placeholder="for whom" className="rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="from" className="rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a short note that rides with the card" rows={3} className="mt-3 w-full resize-none rounded-2xl bg-black/40 px-4 py-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          <button onClick={send} disabled={!file || busy} className="mt-4 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition hover:bg-neutral-200 disabled:opacity-40">
            {busy ? 'sending…' : 'send to outbox'}
          </button>
          {err && <p className="mt-3 text-[13px] text-red-300">{err}</p>}
          {link && (
            <p className="mt-3 break-all text-[13px] text-[#7ec8ff]">
              <a href={link}>{link}</a>
            </p>
          )}
        </motion.section>

        {focus && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">opened link</p>
            <h2 className="mt-1 text-xl font-medium">{focus.name}</h2>
            <p className="mt-1 text-[13px] text-white/50">{pretty(Number(focus.size) || 0)}{focus.sent_to ? ` · for ${focus.sent_to}` : ''}</p>
            {focus.note && <p className="mt-3 text-[15px] text-white/75">{focus.note}</p>}
            <a href={focus.file_url} className="mt-4 inline-flex rounded-full bg-[#0A84FF] px-4 py-2 text-[13px] font-medium text-white">download</a>
          </section>
        )}

        <section className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-[17px] font-medium">Recently sent</h2>
            <button onClick={() => (window.location.href = '/postbag')} className="text-[13px] text-white/50 hover:text-white">reading room</button>
          </div>
          <div className="space-y-2">
            {drops.map((d, i) => (
              <motion.a
                key={d.id}
                href={`/outbox/${d.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]"
              >
                <span>
                  <span className="block text-[14px]">{d.name}</span>
                  <span className="block text-[12px] text-white/40">{d.note || 'no note'}{d.sent_to ? ` · ${d.sent_to}` : ''}</span>
                </span>
                <span className="text-[12px] text-white/40">{pretty(Number(d.size) || 0)}</span>
              </motion.a>
            ))}
            {drops.length === 0 && <p className="text-[13px] text-white/40">Nothing sent yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
