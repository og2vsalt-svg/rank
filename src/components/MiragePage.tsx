import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

export default function MiragePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [dedication, setDedication] = useState('');
  const [accent, setAccent] = useState('#FF9F0A');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);

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
    setCaptions(arr.map(() => ''));
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const updateCaption = (i: number, val: string) => {
    setCaptions((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  };

  const publish = async () => {
    if (!files.length) {
      setErr('drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cap = captions[i]?.trim() || dedication.trim() || 'mirage drop';
        const res = await publishLocalFile(file, {
          caption: cap,
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'mirage', accent, dedication: dedication.trim() || null, caption: cap },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'publish failed for ' + file.name);
          return;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id);
        newLinks.push(urls.app);
      }
      setLinks(newLinks);
      try {
        await navigator.clipboard.writeText(newLinks.join('\n'));
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 17 }}
          className="glass rounded-[36px] p-8 relative overflow-hidden"
        >
          {/* Shimmering heat-haze orbs */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none blur-xl"
              style={{
                background: accent,
                opacity: 0.08 - i * 0.015,
                width: 160 + i * 30,
                height: 160 + i * 30,
                left: `${15 + i * 20}%`,
                top: `${5 + i * 18}%`,
              }}
              animate={{
                y: [0, -15 + i * 5, 0],
                x: [0, 8 - i * 3, 0],
                scale: [1, 1.08, 1],
                opacity: [0.08 - i * 0.015, 0.12 - i * 0.015, 0.08 - i * 0.015],
              }}
              transition={{
                duration: 8 + i * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/4 rounded-full blur-3xl pointer-events-none" />
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>
            mirage
          </p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">what shimmers on the horizon.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop one or more local files into the heat haze. Each can carry its own caption. A shared dedication settles across them. Accent color drives the shimmering orbs. Every file lands in storage and the public share table. Links carry polished Discord embeds. Large files are warned, never refused. Prior desks remain exactly as they were.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            placeholder="optional shared dedication that settles over every file"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length
                ? `${files.length} file${files.length > 1 ? 's' : ''} in the haze`
                : 'drop or click for one or more files'}
            </p>
          </label>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-3"
              >
                {files.map((f, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2 items-start">
                    <p className="text-xs text-neutral-400 truncate flex-1">
                      {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <input
                      value={captions[i] || ''}
                      onChange={(e) => updateCaption(i, e.target.value)}
                      placeholder="caption for this file"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs placeholder:text-neutral-500 focus:outline-none"
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'publish mirage'}
          </motion.button>

          {links.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 text-xs text-neutral-400 space-y-1"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent public drops</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recent.map((r) => (
                <a
                  key={r.id}
                  href={`/s/${r.id}`}
                  className="glass rounded-2xl p-4 block hover:scale-[1.02] transition-transform"
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
