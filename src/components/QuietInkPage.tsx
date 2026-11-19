import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function QuietInkPage() {
  const { navigate } = useRouter();
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const publish = async () => {
    if (!note.trim() && !file) return;
    setBusy(true);
    setErr('');
    try {
      let shareId: string | null = null;
      const caption = note.trim() || title || 'quiet ink';
      if (file) {
        const shared = await publishLocalFile(file, {
          author: 'quietink',
          caption,
          cardTitle: title || caption.slice(0, 80),
        });
        if (!shared.ok || !shared.id) throw new Error(shared.error || 'the file did not settle');
        shareId = shared.id;
        if (shared.warn) setWarn(shared.warn);
      }
      if (note.trim()) {
        const noteFile = new File([note], `${(title || 'note').replace(/[^a-z0-9._-]/gi, '_')}.txt`, { type: 'text/plain' });
        const noteShared = await publishLocalFile(noteFile, {
          author: 'quietink',
          caption: title || 'quiet note',
          cardTitle: title || 'Quiet Ink',
        });
        if (noteShared.ok && noteShared.id && !shareId) shareId = noteShared.id;
        if (noteShared.warn) setWarn(noteShared.warn);
      }
      const card = shareId ? `${location.origin}/s/${shareId}` : '';
      setLink(card);
      if (card) {
        try { await navigator.clipboard.writeText(card); } catch {}
      }
      navigate('quietink');
    } catch (e: any) {
      setErr(e?.message || 'failed to settle');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-gradient-to-tl from-blue-400/15 to-transparent rounded-full blur-3xl" />
          </div>
          <p className="text-[#0A84FF] text-sm mb-2 relative">quiet ink</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3 relative">write with soft ink. attach if the words need company.</h1>
          <p className="text-neutral-400 text-sm mb-6 relative">the note and any local file settle independently into the database. every link carries a polished Discord embed. soft size warnings only. no hard limits. apple-style springs on frosted glass.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="quiet title"
            className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/50 transition-colors relative"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="the words settle here…"
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0A84FF]/40 transition-colors relative resize-none"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-8 text-center mb-4 transition-colors duration-300 relative">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setWarn(f && f.size > 24 * 1024 * 1024 ? 'a heavy page. the send may feel slow. nothing is refused for size.' : '');
              }}
            />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'optional local file'}</span>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3 relative">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3 relative">{err}</p>}
          <button
            onClick={publish}
            disabled={busy || (!note.trim() && !file)}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform relative"
          >
            {busy ? 'settling…' : 'settle the ink'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all relative">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
