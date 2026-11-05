import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietbatchPage() {
  const [items, setItems] = useState<{ file: File; caption: string }[]>([]);
  const [color, setColor] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    if (!list?.length) return;
    const arr = Array.from(list).map(f => ({ file: f, caption: '' }));
    setItems(prev => [...prev, ...arr]);
    const big = arr.some(i => i.file.size > 40 * 1024 * 1024);
    setWarn(big ? 'large drop. the browser may feel slow while it sends. no hard limit.' : '');
    setErr('');
    setLinks([]);
  };

  const updateCaption = (idx: number, cap: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, caption: cap } : it));
  };

  const remove = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const publish = async () => {
    if (!items.length) return;
    setBusy(true);
    setErr('');
    const newLinks: string[] = [];
    try {
      for (const item of items) {
        const res = await publishLocalFile(item.file, { caption: item.caption || 'batch entry', color, cardTitle: item.file.name });
        if (res.ok && res.id) {
          newLinks.push(shareUrls(res.id).app);
          if (res.warn) setWarn(res.warn);
        } else {
          setErr(res.error || 'failed one');
        }
      }
      setLinks(newLinks);
      if (newLinks.length) {
        try { await navigator.clipboard.writeText(newLinks.join('\n')); } catch {}
        setItems([]);
      }
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-16 rounded-full"
            style={{ background: color, left: `${15 + i * 14}%`, top: '30%' }}
            animate={{ y: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}
      </div>
      <div className="relative pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color }}>quietbatch</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">batch what you carry, each with its own note.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">
            Drop several files. Give each a quiet caption. Soft vertical light drifts in your accent. Each lands separately in storage and public_shares with a polished Discord embed. Large drops warned, never refused. All prior desks remain fully intact.
          </p>
          <div className="flex items-center gap-3 mb-6">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-xs text-neutral-400">{color}</span>
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-white/30 p-10 text-center transition mb-6"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={e => onDrop(e.target.files)} />
            <p className="text-white font-medium">{items.length ? `${items.length} file${items.length > 1 ? 's' : ''} in batch` : 'click or drop files for the batch'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limits — only gentle warnings</p>
          </label>
          {items.map((it, idx) => (
            <div key={idx} className="mb-3 flex gap-2 items-start">
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-1 truncate">{it.file.name}</p>
                <input
                  value={it.caption}
                  onChange={e => updateCaption(idx, e.target.value)}
                  placeholder="individual note"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                />
              </div>
              <button onClick={() => remove(idx)} className="text-xs text-neutral-500 hover:text-white mt-6">×</button>
            </div>
          ))}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={busy || !items.length}
            onClick={publish}
            className="mt-6 w-full py-3 rounded-full text-sm font-medium disabled:opacity-40"
            style={{ background: color, color: '#fff' }}
          >
            {busy ? 'forging…' : 'share the batch'}
          </motion.button>
          {links.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400">links copied:</p>
              {links.map(l => (
                <p key={l} className="text-xs text-neutral-300 break-all">{l}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
