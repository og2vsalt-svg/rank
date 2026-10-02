import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function FloorboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [kind, setKind] = useState<'image' | 'audio' | 'text' | 'other'>('other');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [error, setError] = useState('');
  const [links, setLinks] = useState<{ embed: string; page: string } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview('');
      setKind('other');
      setWarn('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (file.type.startsWith('image/')) setKind('image');
    else if (file.type.startsWith('audio/')) setKind('audio');
    else if (file.type.startsWith('text/') || /\.(md|txt|json|csv)$/i.test(file.name)) setKind('text');
    else setKind('other');
    setWarn(file.size > 24 * 1024 * 1024 ? 'large drop. the tab may feel slow while it sends. nothing is refused.' : '');
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const cardTitle = useMemo(() => (file ? file.name : 'floorboard'), [file]);

  const send = async () => {
    if (!file) {
      setError('pick a local file first');
      return;
    }
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, {
      caption: note || undefined,
      color: accent,
      cardTitle: file.name,
      author: 'floorboard',
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'could not file the drop');
      return;
    }
    const urls = shareUrls(res.id);
    setLinks({ embed: res.embed || urls.embed, page: `${location.origin}/floorboard` });
    if (res.warn) setWarn(res.warn);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm font-medium mb-2">floorboard</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">hear it, then hand it over.</h1>
          <p className="text-neutral-400 mb-8 max-w-xl">Not a drawer. A local file gets a quiet preview in the tab, then lands in the share table. Discord unfurls the /s card. Large files are warned, never cut off.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 space-y-4">
            <label className="block rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center cursor-pointer hover:bg-white/[0.03] transition-colors">
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="text-sm text-white">{file ? file.name : 'choose a local file'}</span>
              {file && <span className="block mt-1 text-xs text-neutral-500">{pretty(file.size)} · {file.type || 'unknown type'}</span>}
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line for the discord card" rows={3} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none" />
            <label className="flex items-center justify-between text-xs text-neutral-500">
              card accent
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-8 w-12 rounded-lg bg-transparent border border-white/10" />
            </label>
            {warn && <p className="text-xs text-amber-300/90">{warn}</p>}
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button disabled={busy} onClick={send} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'filing…' : 'file into the share table'}</button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="rounded-3xl overflow-hidden border border-white/10 bg-[#111113]">
            <div className="h-1.5" style={{ background: accent }} />
            <div className="p-5">
              <p className="text-[11px] tracking-[0.14em] uppercase text-neutral-500 mb-2">rankvault</p>
              <h2 className="text-lg font-semibold text-white tracking-tight">{cardTitle}</h2>
              <p className="text-sm text-neutral-400 mt-1">{note || 'drop a file. the card uses the caption you write.'}</p>
              <div className="mt-4 rounded-2xl bg-black/40 min-h-36 flex items-center justify-center overflow-hidden">
                {kind === 'image' && preview && <img src={preview} alt="" className="max-h-48 w-full object-cover" />}
                {kind === 'audio' && preview && <audio src={preview} controls className="w-full px-3" />}
                {kind === 'text' && <p className="text-xs text-neutral-500 px-4 py-6">text stays local until you file it.</p>}
                {kind === 'other' && <p className="text-xs text-neutral-500 px-4 py-6">{file ? 'no inline preview for this type. the card still unfurls.' : 'preview lands here.'}</p>}
              </div>
            </div>
          </motion.div>
        </div>
        {links && (
          <div className="mt-5 glass rounded-3xl p-5 text-sm space-y-2">
            <p className="text-neutral-400">discord card</p>
            <p className="text-white break-all">{links.embed}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => navigator.clipboard.writeText(links.embed)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy card link</button>
              <button onClick={() => navigator.clipboard.writeText(links.page)} className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white">copy page link</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
