import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls } from '../lib/cloudShare';

type Share = {
  id: string;
  name: string;
  size: number;
  caption?: string | null;
  color?: string | null;
  createdAt?: string;
  url?: string;
  mime?: string;
};

function prettySize(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.round(n / 1024) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

export default function QuietEchoFieldPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#5AC8FA');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(24);
      setShares(s.map((m: any) => ({
        id: m.id,
        name: m.name || 'untitled',
        size: m.size || 0,
        caption: m.caption,
        color: m.color,
        createdAt: m.createdAt,
        url: m.url,
        mime: m.type,
      })));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const big = arr.find((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Sending may feel slow. Nothing is refused — only a quiet note of patience.' : null);
  };

  const drop = async () => {
    if (!files.length) return setErr('choose at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const made: string[] = [];
      for (const f of files) {
        const res = await publishLocalFile(f, {
          caption: caption.trim() || undefined,
          color: accent,
          cardTitle: f.name,
          meta: { desk: 'quietechofield', kind: 'echo' },
        });
        if (res.ok && res.embed) made.push(res.embed);
        else if (!res.ok) setErr(res.error || 'upload slowed');
      }
      setLinks(made);
      setFiles([]);
      setCaption('');
      await load();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 20 }}
          className="glass rounded-[40px] p-10 relative overflow-hidden mb-12"
        >
          <div
            className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-30"
            style={{ background: accent }}
          />
          <div className="absolute top-8 left-8 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute top-16 left-16 w-20 h-20 rounded-full border border-white/5 pointer-events-none" />
          <p className="text-sm tracking-wide mb-2" style={{ color: accent }}>quietechofield</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-4 leading-[1.05]">an echo field for what you carry</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-xl">
            Drop one or many local files. Each creates a soft concentric echo that expands and settles on deep navy glass. Recent drops surface as quiet cards that drift into the field. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused. All prior desks remain fully intact.
          </p>

          <div className="flex items-center gap-4 mb-5">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-11 h-11 rounded-2xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional note that travels with the echo"
            rows={3}
            className="w-full mb-5 px-5 py-3.5 rounded-3xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none"
          />

          <label
            className="block cursor-pointer rounded-3xl border border-dashed border-white/15 hover:border-white/25 p-10 text-center transition mb-5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to echo` : 'drop or click for one or more files'}
            </p>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.965 }}
            whileHover={{ scale: 1.012 }}
            onClick={drop}
            disabled={busy || !files.length}
            className="w-full py-3.5 rounded-full text-black text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'echoing…' : 'send into the field'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-xs text-neutral-400 space-y-1.5"
              >
                <p>share links (copied when possible):</p>
                {links.map((l) => (
                  <p key={l} className="break-all">{l}</p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {shares.length > 0 && (
          <div>
            <h2 className="text-sm text-neutral-400 mb-5 tracking-wide">recent echoes</h2>
            <div className="space-y-4">
              {shares.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).embed}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 110, damping: 18 }}
                  className="glass rounded-3xl p-5 block relative overflow-hidden"
                  style={{ borderLeft: `3px solid ${s.color || accent}` }}
                >
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/[0.03] pointer-events-none" />
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 grid place-items-center flex-shrink-0 overflow-hidden">
                      {s.mime?.startsWith('image/') && s.url ? (
                        <img src={s.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-neutral-500 uppercase">{(s.mime || 'file').split('/')[1]?.slice(0, 3) || 'file'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      {s.caption && <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{s.caption}</p>}
                      <p className="text-[10px] text-neutral-600 mt-2">
                        {prettySize(s.size)} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
