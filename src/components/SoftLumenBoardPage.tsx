import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftLumenBoardPage() {
  const [items, setItems] = useState<{ note: string; file?: File }[]>([{ note: '' }]);
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const updateNote = (i: number, note: string) => {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, note } : it));
  };

  const addFile = (i: number, file: File | null) => {
    if (!file) return;
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, file } : it));
    if (file.size > 40 * 1024 * 1024) setWarn('some files are chunky. encoding may feel slow. no hard limit.');
  };

  const addItem = () => setItems((prev) => [...prev, { note: '' }]);

  const publish = async () => {
    const valid = items.filter((it) => it.note.trim() || it.file);
    if (valid.length === 0) {
      setErr('add a note or file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results: string[] = [];
      for (const it of valid) {
        const file = it.file || new File([it.note.trim()], (title.trim() || 'board') + '.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: it.note.trim() || title.trim() || 'soft lumen board',
          cardTitle: title.trim() || file.name,
          color: accent,
          meta: { desk: 'softlumenboard', accent, note: it.note.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'could not publish one item');
          setBusy(false);
          return;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id);
        results.push(urls.app);
      }
      setLinks(results);
      if (results[0]) {
        try { await navigator.clipboard.writeText(results[0]); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>soft lumen board</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet board of shared light</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Collect several notes and optional local files on one board. Each lands as its own share with your accent. Files go to storage and the share table. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain untouched.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional board title"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/20 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          {items.map((it, i) => (
            <div key={i} className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <textarea
                value={it.note}
                onChange={(e) => updateNote(i, e.target.value)}
                placeholder={`note ${i + 1} (optional)`}
                rows={2}
                className="w-full mb-2 px-3 py-2 rounded-xl bg-transparent border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
              />
              <label className="block text-xs text-neutral-400 cursor-pointer">
                {it.file ? it.file.name : 'optional local file'}
                <input type="file" className="hidden" onChange={(e) => addFile(i, e.target.files?.[0] || null)} />
              </label>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-xs text-neutral-400 hover:text-white mb-4 transition">+ add another</button>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy}
            className="w-full py-3 rounded-full text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'pinning to the board…' : 'publish board'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>share links (first copied):</p>
              {links.map((l, i) => (
                <p key={i} className="break-all">{l}</p>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
