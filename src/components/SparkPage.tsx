import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

export default function SparkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [shared, setShared] = useState('');
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
    setNotes(arr.map(() => ''));
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const setNote = (i: number, v: string) => {
    setNotes((prev) => {
      const next = [...prev];
      next[i] = v;
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
        const caption = notes[i]?.trim() || shared.trim() || 'spark';
        const res = await publishLocalFile(file, {
          caption,
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'spark', accent, shared: shared.trim() || null },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'publish failed for ' + file.name);
          return;
        }
        if (res.warn) setWarn(res.warn);
        newLinks.push(shareUrls(res.id).app);
      }
      setLinks(newLinks);
      try { await navigator.clipboard.writeText(newLinks.join('\n')); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
          className="glass rounded-[36px] p-8 relative overflow-hidden"
        >
          {[0, 1, 2].map((n) => (
            <motion.div
              key={n}
              className="absolute rounded-full blur-3xl pointer-events-none"
              style={{
                background: accent,
                width: 180 + n * 40,
                height: 180 + n * 40,
                left: `${20 + n * 25}%`,
                top: `${10 + n * 20}%`,
                opacity: 0.15 + n * 0.05,
              }}
              animate={{
                y: [0, -12, 0],
                x: [0, 8, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 6 + n, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>
            spark
          </p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">small lights that travel.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop files with individual notes or a shared spark. Each lands in storage and the public share table. Links carry polished Discord embeds. Large files warned, never refused. Different from a plain vault — reactive glow particles follow your accent.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
            <span className="text-xs text-neutral-500 font-mono">{accent}</span>
          </div>

          <textarea
            value={shared}
            onChange={(e) => setShared(e.target.value)}
            placeholder="optional shared spark note"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none transition resize-none"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop or click for files'}
            </p>
          </label>

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="truncate flex-1">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    <input value={notes[i] || ''} onChange={(e) => setNote(i, e.target.value)} placeholder="note" className="w-40 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'sparking…' : 'spark'}
          </motion.button>

          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>copied share links:</p>
              {links.map((l, i) => <p key={i} className="break-all">{l}</p>)}
            </motion.div>
          )}
        </motion.div>

        {recent.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent sparks</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.map((r) => (
                <a key={r.id} href={`/s/${r.id}`} className="glass rounded-2xl p-4 block hover:scale-[1.02] transition-transform">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {r.caption && <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{r.caption}</p>}
                  <p className="text-[10px] text-neutral-600 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
