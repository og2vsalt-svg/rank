import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

const KEY = 'rankvault-gossamer';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

export default function GossamerPage() {
  const [whisper, setWhisper] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#E8E8ED');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.whisper === 'string') setWhisper(p.whisper);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ whisper }));
    } catch {}
  }, [whisper]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${supabaseConfig.url}/rest/v1/public_shares?is_public=eq.true&select=id,name,caption,created_at&order=created_at.desc&limit=8`,
          {
            headers: {
              apikey: supabaseConfig.anonKey,
              Authorization: `Bearer ${supabaseConfig.anonKey}`,
            },
          },
        );
        if (res.ok) {
          const rows = await res.json();
          setRecent(Array.isArray(rows) ? rows : []);
        }
      } catch {}
    })();
  }, []);

  const onFiles = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    setFiles(arr);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const publish = async () => {
    if (!files.length && !whisper.trim()) {
      setErr('leave a whisper or drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: whisper.trim() || 'gossamer drop',
            cardTitle: file.name,
            color: accent,
            meta: { desk: 'gossamer', accent, whisper: whisper.trim() || null },
          });
          if (!res.ok || !res.id) {
            setErr(res.error || 'publish failed for ' + file.name);
            return;
          }
          if (res.warn) setWarn(res.warn);
          const urls = shareUrls(res.id);
          newLinks.push(urls.app);
        }
      }
      setLinks(newLinks);
      if (newLinks.length) {
        try {
          await navigator.clipboard.writeText(newLinks.join('\n'));
        } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-white/30 origin-left"
            style={{
              left: `${5 + (i * 5) % 90}%`,
              top: `${10 + (i * 13) % 80}%`,
              width: `${40 + (i % 5) * 20}px`,
              rotate: `${-20 + (i % 7) * 8}deg`,
            }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scaleX: [0.8, 1.2, 0.8],
              y: [0, -12 - (i % 4) * 4, 0],
            }}
            transition={{
              duration: 9 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.25,
            }}
          />
        ))}
      </div>
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, rgba(232,232,237,0.06), rgba(255,255,255,0.03))' }}
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>gossamer</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">threads of light for what drifts.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            A whisper stays with every file you release. Each lands in the database with polished Discord embeds and soft spring motion. Large files warned, never refused. Prior notes remain on this device.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">silk</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={whisper}
            onChange={(e) => setWhisper(e.target.value)}
            placeholder="a quiet whisper that travels with the threads…"
            className="w-full min-h-[140px] rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-y mb-4"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length
                ? `${files.length} file${files.length > 1 ? 's' : ''} ready`
                : 'drop or click to release files'}
            </p>
          </label>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-1 text-xs text-neutral-400"
              >
                {files.map((f, i) => (
                  <li key={i} className="truncate">
                    {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || (!files.length && !whisper.trim())}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-50 transition mb-5"
            style={{ background: accent }}
          >
            {busy ? 'weaving…' : files.length ? 'release with whisper' : 'keep whisper locally'}
          </motion.button>

          {links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-neutral-400 space-y-1"
            >
              <p>copied share links:</p>
              {links.map((l, i) => (
                <p key={i} className="break-all">
                  {l}
                </p>
              ))}
            </motion.div>
          )}
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent threads</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recent.map((r) => (
                <a
                  key={r.id}
                  href={`/s/${r.id}`}
                  className="glass rounded-2xl p-4 block hover:scale-[1.03] transition-transform"
                >
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.caption && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{r.caption}</p>
                  )}
                  <p className="text-[10px] text-neutral-600 mt-2">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
