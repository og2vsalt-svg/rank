import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

const KEY = 'rankvault-prismwell';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

export default function PrismwellPage() {
  const [dedication, setDedication] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [accent, setAccent] = useState('#A78BFA');
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
        if (typeof p.dedication === 'string') setDedication(p.dedication);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ dedication }));
    } catch {}
  }, [dedication]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${supabaseConfig.url}/rest/v1/public_shares?is_public=eq.true&select=id,name,caption,created_at&order=created_at.desc&limit=6`,
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
    if (!files.length && !dedication.trim()) {
      setErr('leave a dedication or drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      if (files.length) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const cap = captions[i]?.trim() || dedication.trim() || 'prismwell drop';
          const res = await publishLocalFile(file, {
            caption: cap,
            cardTitle: file.name,
            color: accent,
            meta: { desk: 'prismwell', accent, dedication: dedication.trim() || null, fileCaption: captions[i] || null },
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
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              width: `${80 + (i % 4) * 40}px`,
              height: `${80 + (i % 4) * 40}px`,
              background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.15, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 18 + i * 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}
      </div>
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>prismwell</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a well of refracted light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Each file carries its own caption through the prism. Shared dedication stays local until published. All land in the database with polished Discord embeds and spring motion. Large files warned, never refused.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">spectrum</label>
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
            placeholder="a shared dedication that colors the well…"
            className="w-full min-h-[100px] rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-y mb-4"
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
                ? `${files.length} file${files.length > 1 ? 's' : ''} in the well`
                : 'drop or click to place files in the well'}
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
                  <div key={i} className="space-y-1">
                    <p className="text-xs text-neutral-400 truncate">
                      {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <input
                      value={captions[i] || ''}
                      onChange={(e) => updateCaption(i, e.target.value)}
                      placeholder="individual caption for this refraction…"
                      className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-xs text-white outline-none"
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
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || (!files.length && !dedication.trim())}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-50 transition mb-5"
            style={{ background: accent }}
          >
            {busy ? 'refracting…' : files.length ? 'cast into the well' : 'keep dedication locally'}
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
            transition={{ delay: 0.15 }}
            className="mt-10"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent refractions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
