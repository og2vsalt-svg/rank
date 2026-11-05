import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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

export default function SoftAuroraStreamPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [accent, setAccent] = useState('#7dd3fc');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const s = await listPublicShares(18);
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
    setWarn(big ? 'Large files present. The stream may feel slow while it carries them. No hard limit — only a gentle warning.' : null);
  };

  const drop = async () => {
    if (!files.length) return setErr('drop at least one file into the stream');
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
          meta: { desk: 'softaurorastream', kind: 'stream' },
        });
        if (res.ok && res.embed) made.push(res.embed);
        else if (!res.ok) setErr(res.error || 'stream slowed');
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
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 19 }}
          className="glass rounded-[36px] p-10 relative overflow-hidden mb-14"
        >
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
              backgroundSize: '200% 100%',
            }}
          />
          <p className="text-sm tracking-wide mb-2" style={{ color: accent }}>softaurorastream</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-4 leading-[1.05]">a flowing stream of light</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-2xl">
            Drop local files into a soft aurora stream. Ribbons of light carry each share, rising and settling with spring motion on deep navy glass. Recent drops appear as quiet cards that drift with the current. Lands in storage and public_shares. Discord unfurls a polished card on every link. Large drops warned, never refused. All prior desks remain fully intact.
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
            placeholder="optional note carried by the stream"
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
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the stream` : 'drop or click for one or more files'}
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
            {busy ? 'flowing…' : 'release into the stream'}
          </motion.button>

          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-xs text-neutral-400 space-y-1.5">
              <p>share links:</p>
              {links.map((l) => (
                <p key={l} className="break-all">{l}</p>
              ))}
            </motion.div>
          )}
        </motion.div>

        {shares.length > 0 && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-5 min-w-max px-1">
              {shares.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).embed}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 100, damping: 17 }}
                  className="glass rounded-3xl p-5 w-64 flex-shrink-0 block"
                  style={{ borderTop: `3px solid ${s.color || accent}` }}
                >
                  <div className="h-32 rounded-2xl bg-white/5 mb-4 overflow-hidden grid place-items-center">
                    {s.mime?.startsWith('image/') && s.url ? (
                      <img src={s.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-neutral-500 uppercase tracking-wide">{(s.mime || 'file').split('/')[1]?.slice(0, 4) || 'file'}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  {s.caption && <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{s.caption}</p>}
                  <p className="text-[10px] text-neutral-600 mt-3">
                    {prettySize(s.size)} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}
                  </p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
