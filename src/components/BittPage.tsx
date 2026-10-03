import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function BittPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState('');
  const [rail, setRail] = useState('');
  const [warn, setWarn] = useState('');

  const slow = useMemo(() => {
    if (!file) return '';
    if (file.size > 12 * 1024 * 1024) return 'heavy file. it still goes up. the tab may feel slow while it sends.';
    return '';
  }, [file]);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    const filed = await publishLocalFile(file, {
      caption: note.trim() || undefined,
      author: 'bitt',
      cardTitle: file.name,
      color: '#30D158',
    });
    if (!filed.ok || !filed.id) {
      setBusy(false);
      setError(filed.error || 'the share table did not take that file');
      return;
    }
    const links = shareUrls(filed.id);
    setCard(filed.embed || links.embed);
    setWarn(filed.warn || slow);
    try {
      const pin = await fetch('/api/cleat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: filed.embed || links.embed, note: note.trim() || file.name, author: 'bitt' }),
      });
      const body = await pin.json().catch(() => ({}));
      if (pin.ok && body.ok) setRail(`${location.origin}/cleat`);
    } catch {
      setRail('');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#30D158] text-sm font-medium mb-2">bitt</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">tie a local file to the rail.</h1>
          <p className="text-neutral-400 text-sm mb-8">the bytes go into the share table. the Discord card is then pinned on the cleat shelf, so the file and the address stay together. not a vault drawer. no size cap — only a slowness note.</p>
        </motion.div>
        <motion.button
          type="button"
          onClick={() => inputRef.current?.click()}
          whileTap={{ scale: 0.985 }}
          className="w-full glass rounded-[28px] px-6 py-10 text-left"
        >
          <p className="text-white font-medium">{file ? file.name : 'choose a file from this machine'}</p>
          <p className="text-sm text-neutral-500 mt-1">{file ? pretty(file.size) : 'it uploads when you tie it, not before'}</p>
        </motion.button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); setCard(''); }} />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="why this stays on the rail" className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#30D158]/50 resize-none" />
        {slow && <p className="mt-3 text-xs text-amber-300/90">{slow}</p>}
        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        <button disabled={!file || busy} onClick={send} className="mt-4 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy ? 'tying…' : 'tie it to the rail'}</button>
        {card && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mt-5">
            <p className="text-sm text-white">filed, and the card is on the rail.</p>
            <p className="text-xs text-neutral-500 mt-1 break-all">{card}</p>
            {warn && <p className="text-xs text-amber-300/90 mt-2">{warn}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => navigator.clipboard.writeText(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
              {rail && <a href={rail} className="text-xs px-3 py-1.5 rounded-full bg-white/8 text-white">open the rail</a>}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
