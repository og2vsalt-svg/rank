import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function DiscordStudioPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('Share from rankvault');
  const [caption, setCaption] = useState('Clean private hosting. Soft warnings only.');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; embed: string } | null>(null);
  const [error, setError] = useState('');

  const publish = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    const res = await publishLocalFile(file, {
      cardTitle: title.trim() || file.name,
      caption: caption.trim() || undefined,
      color: accent,
    });
    setBusy(false);
    if (!res.ok || !res.id) {
      setError(res.error || 'could not publish');
      return;
    }
    setResult({ id: res.id, embed: res.embed || shareUrls(res.id).embed });
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white pt-24 pb-20 px-5">
      <div className="max-w-xl mx-auto">
        <motion.button onClick={() => navigate('home')} className="text-xs text-neutral-500 hover:text-white mb-8">← home</motion.button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">discord studio</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">shape the embed.</h1>
          <p className="text-neutral-400 text-base leading-relaxed mb-10">
            Upload a local file, craft the title and caption that Discord (and others) will show, then publish a professional share link. Soft size warnings only.
          </p>
        </motion.div>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-white/10 file:text-white hover:file:bg-white/15"
        />

        {file && (
          <div className="mt-6 space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="embed title"
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="embed description"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20 resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-8 rounded border-0 bg-transparent" />
            </div>

            <div className="glass rounded-3xl p-5 mt-4">
              <p className="text-xs text-neutral-500 mb-2">discord preview</p>
              <div className="border-l-4 pl-3" style={{ borderColor: accent }}>
                <p className="font-medium text-sm">{title || 'Title'}</p>
                <p className="text-xs text-neutral-400 mt-1">{caption || 'Description'}</p>
                <p className="text-[11px] text-neutral-600 mt-2">rankvault</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              onClick={publish}
              className="w-full py-3.5 rounded-full text-sm font-medium text-white disabled:opacity-50"
              style={{ background: accent }}
            >
              {busy ? 'publishing…' : 'publish with this embed'}
            </motion.button>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 glass rounded-3xl p-6">
            <p className="text-sm font-medium mb-2">share ready — Discord will show the card</p>
            <p className="text-xs text-neutral-500 break-all mb-4">{result.embed}</p>
            <button onClick={() => navigator.clipboard.writeText(result.embed)} className="px-4 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15">copy link</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
