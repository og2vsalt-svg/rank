import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import { publishLocalFile, fetchShare, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const tones = [
  { id: 'ivory', label: 'ivory', swatch: '#f5f0e6' },
  { id: 'ink', label: 'ink', swatch: '#1c1c1e' },
  { id: 'sea', label: 'sea', swatch: '#0a84ff' },
  { id: 'clay', label: 'clay', swatch: '#c4a484' },
];

export default function DecklePage() {
  const { shareId, navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dedication, setDedication] = useState('');
  const [keeper, setKeeper] = useState('');
  const [tone, setTone] = useState('ivory');
  const [status, setStatus] = useState('a local file becomes a deckle. the bytes go into the share table. no size cap.');
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<CloudMeta | null>(null);

  const toneColor = useMemo(() => tones.find((t) => t.id === tone)?.swatch || '#f5f0e6', [tone]);

  useEffect(() => {
    if (!shareId) return;
    setLink(`${location.origin}/deckle/${shareId}`);
    setStatus('this deckle is already in the share table. paste the link in Discord for the card.');
    fetchShare(shareId).then((row) => {
      if (row) setOpened(row);
    }).catch(() => setStatus('the row did not open. the link is still valid.'));
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    setLink('');
    if (!next) {
      setWarn('');
      return;
    }
    if (next.size > 25 * 1024 * 1024) {
      setWarn('this sheet is heavy. the browser may feel slow while it sends. it is still accepted.');
    } else setWarn('');
  }

  async function bind() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('laying the sheet into the share table...');
    try {
      const result = await publishLocalFile(file, {
        caption: dedication.trim() || 'deckle sheet',
        author: keeper.trim() || 'deckle',
        cardTitle: file.name,
        color: tone,
      });
      if (!result.ok || !result.id) {
        setStatus(result.error || 'the share table did not take the file.');
        return;
      }
      const card = `${location.origin}/deckle/${result.id}`;
      setLink(card);
      setOpened(result.meta || null);
      setStatus(result.warn || 'bound. paste the link in Discord for the card.');
      navigate('deckle', result.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[11px] tracking-[0.18em] uppercase text-white/40 mb-3">rankvault · deckle</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">a sheet with a rough edge</h1>
          <p className="mt-4 text-neutral-400 max-w-xl">drop one local file. it lands in the database, with a dedication on the deckle. older desks stay. large drops are warned, never refused.</p>
        </motion.div>
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-7 backdrop-blur-xl">
          <label className="block rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center cursor-pointer hover:border-white/30 transition">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-white/80">{file ? file.name : 'choose a local file'}</span>
            <span className="block mt-1 text-xs text-white/40">{file ? pretty(file.size) : 'any size'}</span>
          </label>
          {warn && <p className="mt-3 text-xs text-amber-200/90">{warn}</p>}
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <input value={keeper} onChange={(e) => setKeeper(e.target.value)} placeholder="who laid this" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30" />
            <input value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder="a line on the edge" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30" />
          </div>
          <div className="mt-4 flex gap-2">
            {tones.map((item) => (
              <button key={item.id} type="button" onClick={() => setTone(item.id)} className={`h-9 px-3 rounded-full text-xs border transition ${tone === item.id ? 'border-white text-white' : 'border-white/10 text-white/50'}`}>
                <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle" style={{ background: item.swatch }} />
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={bind} disabled={!file || busy} className="mt-5 inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">
            {busy ? 'binding...' : 'bind the deckle'}
          </button>
          <p className="mt-4 text-sm text-white/50">{status}</p>
          {link && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <code className="text-xs text-[#9ecbff] break-all">{link}</code>
              <button onClick={() => navigator.clipboard.writeText(link)} className="text-xs px-3 py-1.5 rounded-full bg-white/10">copy</button>
            </div>
          )}
        </motion.section>
        {opened && (
          <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-[28px] p-6 border border-white/10" style={{ background: `linear-gradient(180deg, ${toneColor}22, transparent)` }}>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">opened sheet</p>
            <h2 className="mt-2 text-2xl tracking-tight">{opened.name || 'file'}</h2>
            <p className="mt-2 text-sm text-white/60">{opened.caption || dedication || 'no dedication yet'}</p>
            <p className="mt-1 text-xs text-white/40">{pretty(opened.size)} · {opened.author || keeper || 'deckle'}</p>
            {opened.fileUrl && <a href={opened.fileUrl} className="inline-flex mt-4 text-sm text-[#0a84ff]" target="_blank" rel="noreferrer">download the sheet</a>}
          </motion.article>
        )}
      </main>
    </div>
  );
}
