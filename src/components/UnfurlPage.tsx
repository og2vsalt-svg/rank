import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { fetchShare, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function idFrom(raw: string) {
  const text = raw.trim();
  if (!text) return '';
  const match = text.match(/\/(?:s|f|open|go|link|card|unfurl|bollard)\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  const q = text.match(/[?&]f=([A-Za-z0-9_-]+)/);
  if (q) return q[1];
  return text.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
}

export default function UnfurlPage() {
  const { shareId, navigate } = useRouter();
  const [raw, setRaw] = useState(shareId || '');
  const [meta, setMeta] = useState<CloudMeta | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (id: string) => {
    if (!id) {
      setErr('paste a share link or id.');
      setMeta(null);
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const row = await fetchShare(id);
      setMeta(row);
      if (!row) setErr('no public row for that id.');
    } catch {
      setErr('the share table did not answer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shareId) load(shareId);
  }, [shareId]);

  const spring = { type: 'spring' as const, stiffness: 380, damping: 32 };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[12px] uppercase tracking-[0.16em] text-neutral-500">unfurl</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">See the card before you send it.</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-400">
          Paste any rankvault share link. This is the title, size, and color Discord reads from the page. Bots are redirected to the card route; people land on the file.
        </p>
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const id = idFrom(raw);
            setRaw(id);
            navigate('unfurl', id);
            load(id);
          }}
        >
          <input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="https://…/s/abc or an id" className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[15px] outline-none focus:border-[#0A84FF]" />
          <button className="rounded-full bg-white px-5 py-3 text-[14px] font-medium text-black" type="submit">{loading ? 'reading…' : 'unfurl'}</button>
        </form>
        {err && <p className="mt-4 text-[13px] text-[#ff6b6b]">{err}</p>}
        {meta && (
          <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mt-8 rounded-[28px] border border-white/10 bg-[#111113] p-5">
            <div className="flex gap-4">
              <div className="w-1 rounded-full" style={{ background: meta.color || '#0A84FF' }} />
              <div>
                <p className="text-[12px] text-neutral-500">rankvault · discord embed</p>
                <h2 className="mt-1 text-[18px] font-semibold">{meta.cardTitle || meta.name}</h2>
                <p className="mt-1 text-[13px] text-neutral-400">{meta.caption || `${pretty(meta.size)} · public drop on rankvault`}</p>
                <p className="mt-3 break-all text-[12px] text-neutral-500">{location.origin}/s/{meta.id}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => navigate('share', meta.id)} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black">open file</button>
              <a className="rounded-full bg-white/10 px-4 py-2 text-[13px]" href={`/api/embed?page=unfurl&id=${encodeURIComponent(meta.id)}&embed=1`} target="_blank" rel="noreferrer">raw card</a>
            </div>
          </motion.article>
        )}
      </main>
    </div>
  );
}
