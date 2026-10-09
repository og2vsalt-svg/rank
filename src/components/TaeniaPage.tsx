import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const ease = [0.22, 1, 0.36, 1] as const;

type Beam = {
  id: string;
  beam?: string | null;
  for_whom?: string | null;
  reply?: string | null;
  author?: string | null;
  name?: string | null;
  size?: number;
  share_id?: string | null;
};

function pretty(bytes?: number) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function TaeniaPage() {
  const { shareId } = useRouter();
  const [beams, setBeams] = useState<Beam[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/architrave');
    const data = await r.json().catch(() => ({}));
    setBeams(Array.isArray(data.beams) ? data.beams : []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/architrave?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing beam');
        setOpen(data);
        setReply(data.reply || '');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that beam'));
  }, [shareId]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!open?.id || !reply.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/architrave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: open.id, reply }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'reply did not land');
      setOpen({ ...open, reply });
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'reply failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#64d2ff] text-sm font-medium tracking-wide">
          band
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-3 text-4xl font-semibold tracking-tight">
          replies on the band.
        </motion.h1>
        <p className="mt-4 max-w-xl text-neutral-400 leading-relaxed">No new file on this page. Open a beam, read the line, download what was already filed, and leave a reply.</p>
        {open && (
          <motion.form onSubmit={sendReply} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 mt-8">
            <p className="text-sm text-neutral-500">{open.author || 'unsigned'} → {open.for_whom || 'anyone'}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{open.beam || open.name}</h2>
            {open.share?.file_url && (
              <a href={open.share.file_url} className="mt-4 inline-flex px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm" target="_blank" rel="noreferrer">
                open {open.share.name} · {pretty(open.share.size)}
              </a>
            )}
            <label className="block mt-5 text-[13px] text-neutral-400 mb-2">reply</label>
            <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25" />
            {err && <p className="mt-3 text-sm text-[#ff375f]">{err}</p>}
            <button disabled={busy} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-60">
              {busy ? 'leaving it…' : 'leave the reply'}
            </button>
          </motion.form>
        )}
        <div className="mt-10 grid sm:grid-cols-2 gap-3">
          {beams.map((item, i) => (
            <motion.a key={item.id} href={`/taenia/${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, ease }} className="apple-card rounded-3xl border border-white/10 bg-white/[0.03] p-4 block">
              <p className="text-sm text-white line-clamp-3">{item.beam || item.name}</p>
              <p className="mt-3 text-[12px] text-neutral-500">{item.for_whom || 'anyone'} · {item.reply ? 'replied' : 'waiting'} · {pretty(item.size)}</p>
            </motion.a>
          ))}
          {!beams.length && <p className="text-sm text-neutral-500">no beams yet. set one on architrave.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
