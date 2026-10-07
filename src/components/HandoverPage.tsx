import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SLOW = 12 * 1024 * 1024;

function prettySize(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

type Handover = {
  id: string;
  file_name: string;
  mime: string | null;
  size: number;
  file_url?: string;
  fromName: string | null;
  nextName: string;
  step: number;
  chain: string;
  note: string;
  warn?: string | null;
};

export default function HandoverPage() {
  const { shareId, navigate } = useRouter();
  const [items, setItems] = useState<Handover[]>([]);
  const [focus, setFocus] = useState<Handover | null>(null);
  const [fromName, setFromName] = useState('');
  const [nextName, setNextName] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState('1');
  const [chain, setChain] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/handover');
    const data = await res.json();
    setItems(Array.isArray(data.handovers) ? data.handovers : []);
  }

  useEffect(() => { load().catch(() => setError('the handover desk is quiet right now')); }, []);

  useEffect(() => {
    if (!shareId) { setFocus(null); return; }
    fetch(`/api/handover?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => {
        setFocus(data.ok ? data : null);
        if (data.ok) {
          setChain(data.chain || '');
          setStep(String((Number(data.step) || 1) + 1));
          setFromName(data.nextName || '');
        }
      })
      .catch(() => setFocus(null));
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setWarn(next && next.size > SLOW ? 'this handoff is heavy. it may open slowly. it is still accepted.' : '');
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('choose a file on this machine'); return; }
    if (!nextName.trim()) { setError('who gets it next?'); return; }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('could not read the file'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextName: nextName.trim(),
          fromName: fromName.trim(),
          note: note.trim(),
          step: Number(step) || 1,
          chain: chain.trim(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'could not pass the file');
      setLink(data.link);
      if (data.warn) setWarn(data.warn);
      setNextName('');
      setNote('');
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not pass the file');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20 apple-in">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.22em] uppercase text-white/40 mb-3">chain pass</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="text-4xl font-semibold tracking-tight">handover</motion.h1>
        <p className="mt-3 text-white/55 leading-relaxed">Pass a local file to the next person and keep the step on the chain. Bytes land in storage, the row in the share table. Large drops are warned, never refused. Discord unfurls /handover/id. Not a cabinet.</p>
        {focus ? (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass apple-card rounded-3xl p-6 mt-8">
            <p className="text-xs uppercase tracking-widest text-white/40">step {focus.step}</p>
            <h2 className="text-2xl mt-2 font-medium">for {focus.nextName}</h2>
            <p className="text-white/60 mt-2">{focus.note || 'no note on this pass'}</p>
            <p className="text-sm text-white/40 mt-4">{focus.file_name} · {prettySize(Number(focus.size) || 0)}{focus.fromName ? ` · from ${focus.fromName}` : ''}</p>
            {focus.warn ? <p className="text-amber-200/90 text-sm mt-3">{focus.warn}</p> : null}
            {focus.file_url && !String(focus.file_url).startsWith('data:') ? <a className="inline-flex mt-5 px-4 py-2 rounded-full bg-white text-black text-sm" href={focus.file_url}>open the file</a> : null}
          </motion.article>
        ) : null}
        <form onSubmit={send} className="glass rounded-3xl p-6 mt-8 space-y-4">
          <label className="block text-sm text-white/70">next
            <input value={nextName} onChange={(e) => setNextName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="who receives this step" />
          </label>
          <label className="block text-sm text-white/70">from
            <input value={fromName} onChange={(e) => setFromName(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="optional" />
          </label>
          <label className="block text-sm text-white/70">note on this pass
            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="what changed, or what to do" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-white/70">step
              <input value={step} onChange={(e) => setStep(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" />
            </label>
            <label className="block text-sm text-white/70">chain
              <input value={chain} onChange={(e) => setChain(e.target.value)} className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-white/30 transition-colors" placeholder="filled when you continue" />
            </label>
          </div>
          <label className="block text-sm text-white/70">local file
            <input type="file" onChange={(e) => pick(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-white/70" />
          </label>
          {warn ? <p className="text-amber-200/90 text-sm">{warn}</p> : null}
          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          {link ? <p className="text-sm text-white/70 break-all">share this: {link}</p> : null}
          <button disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50 transition-transform active:scale-[0.98]">{busy ? 'passing…' : 'pass the file'}</button>
        </form>
        <ul className="mt-8 space-y-3">
          {items.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
              <button onClick={() => navigate('handover', item.id)} className="w-full text-left glass apple-card rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform">
                <span className="block font-medium">step {item.step} · for {item.nextName}</span>
                <span className="block text-sm text-white/45">{item.file_name} · {prettySize(Number(item.size) || 0)}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
