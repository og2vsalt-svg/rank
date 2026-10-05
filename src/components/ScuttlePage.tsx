import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

type Hatch = { id: string; name: string; caption?: string; size?: number; created_at?: string };

export default function ScuttlePage() {
  const { navigate, shareId } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('open hatch');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [hatches, setHatches] = useState<Hatch[]>([]);

  useEffect(() => {
    fetch('/api/scuttle?list=1')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.hatches)) setHatches(data.hatches); })
      .catch(() => {});
  }, [link]);

  const pick = (f: File | null) => {
    setFile(f);
    setErr('');
    setLink('');
    setWarn(f && f.size > 24 * 1024 * 1024 ? 'a wide hatch. the send may feel slow. nothing is refused for size.' : '');
  };

  const fileIt = async () => {
    if (!file || !title.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const shared = await publishLocalFile(file, { author: 'scuttle', caption: note || title, cardTitle: title.trim() });
      if (!shared.ok || !shared.id) throw new Error(shared.error || 'the file did not land');
      const res = await fetch('/api/scuttle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), note, fileId: shared.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'the hatch did not close');
      setLink(`${window.location.origin}/scuttle/${data.id}`);
      navigate('scuttle', data.id);
    } catch (e: any) {
      setErr(e.message || 'could not file this hatch');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">not a drawer</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">scuttle</h1>
          <p className="mt-3 text-neutral-400 leading-relaxed">A hatch for a note and a local file. The file is written to the share table. Discord reads the card on this link. Large drops are warned, never refused.</p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass mt-8 rounded-3xl p-6">
          <label className="block text-sm text-neutral-400">title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-2xl bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          <label className="mt-4 block text-sm text-neutral-400">note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-2 w-full resize-none rounded-2xl bg-white/5 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" placeholder="what this hatch is for" />
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-neutral-400 transition hover:border-[#0A84FF]/60">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            {file ? <span className="text-white">{file.name} · {pretty(file.size)}</span> : <span>drop a local file, any size</span>}
          </label>
          {warn && <p className="mt-3 text-sm text-amber-300/90">{warn}</p>}
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          <button onClick={fileIt} disabled={busy || !file} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-40">{busy ? 'filing…' : 'file the hatch'}</button>
          {link && <p className="mt-4 break-all text-sm text-[#8ec8ff]">{link}</p>}
          {shareId && !link && <p className="mt-4 text-sm text-neutral-500">this hatch is /scuttle/{shareId}</p>}
        </motion.section>
        <section className="mt-8">
          <h2 className="text-sm uppercase tracking-[0.16em] text-neutral-500">recent hatches</h2>
          <div className="mt-3 grid gap-3">
            {hatches.map((h, i) => (
              <motion.button key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} onClick={() => navigate('scuttle', h.id)} className="glass rounded-2xl px-4 py-3 text-left">
                <div className="text-white">{h.name}</div>
                <div className="text-sm text-neutral-400">{h.caption || 'filed'}</div>
              </motion.button>
            ))}
            {!hatches.length && <p className="text-sm text-neutral-500">nothing filed yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
