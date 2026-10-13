import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { supabaseConfig } from '../lib/supabase';

type Recent = { id: string; name: string; caption: string | null; created_at: string };

export default function CapsulePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [unlock, setUnlock] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState<Recent[]>([]);
  const [localName, setLocalName] = useState('');
  const [localNote, setLocalNote] = useState('');
  const [localWhen, setLocalWhen] = useState('');
  const [localSaved, setLocalSaved] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const iso = tomorrow.toISOString().slice(0, 16);
    setUnlock(iso);
    setLocalWhen(iso);

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
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'one or more large files. the browser may feel slow while sending. no hard limit — only a gentle warning.'
        : '',
    );
  };

  const publish = async () => {
    if (!files.length) {
      setErr('drop at least one file');
      return;
    }
    const unlockAt = unlock ? new Date(unlock).toISOString() : null;
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'sealed capsule',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'capsule', accent, unlockAt, dedication: note.trim() || null },
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

  function sealLocal() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const row = { id, name: localName || 'untitled capsule', note: localNote, opensAt: localWhen, createdAt: Date.now() };
    const list = JSON.parse(localStorage.getItem('rank_capsules') || '[]');
    list.unshift(row);
    localStorage.setItem('rank_capsules', JSON.stringify(list));
    setLocalSaved(id);
    setLocalName('');
    setLocalNote('');
  }

  const localList = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('rank_capsules') || '[]') : [];
  const now = Date.now();

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[36px] p-8 relative overflow-hidden"
        >
          <div
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ background: accent }}
          />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>
            capsule
          </p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">seal files until a chosen hour.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop one or more local files. Each lands in storage and the public share table with your dedication, accent, and unlock moment. Share links carry polished Discord embeds. Large files are warned, never refused. Local note capsules remain below.
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

          <label className="block text-xs text-neutral-400 mb-1">unlock at</label>
          <input
            type="datetime-local"
            value={unlock}
            onChange={(e) => setUnlock(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm focus:outline-none"
          />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional dedication that travels with every sealed file"
            rows={3}
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
                ? `${files.length} file${files.length > 1 ? 's' : ''} ready to seal`
                : 'drop or click for one or more files'}
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
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'sealing…' : 'seal files'}
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

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">local notes</p>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">seal a private note.</h2>
          <p className="text-neutral-400 text-sm mb-6">stays on this device until the date you pick. never leaves the browser.</p>
          <input value={localName} onChange={(e) => setLocalName(e.target.value)} placeholder="capsule name" className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none mb-3 focus:border-[#0a84ff]/50" />
          <textarea value={localNote} onChange={(e) => setLocalNote(e.target.value)} placeholder="what should open later" className="w-full min-h-[120px] rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none mb-3 focus:border-[#0a84ff]/50" />
          <input type="datetime-local" value={localWhen} onChange={(e) => setLocalWhen(e.target.value)} className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm outline-none mb-4 focus:border-[#0a84ff]/50" />
          <button onClick={sealLocal} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">seal note</button>
          {localSaved && <p className="text-xs text-neutral-500 mt-3">sealed {localSaved}</p>}
          <div className="mt-6 space-y-3">
            {localList.map((c: any) => {
              const open = !c.opensAt || new Date(c.opensAt).getTime() <= now;
              return (
                <div key={c.id} className="glass rounded-[24px] p-5">
                  <p className="text-sm text-white">{c.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{open ? 'unlocked' : 'locked until ' + c.opensAt}</p>
                  {open && <p className="text-sm text-neutral-300 mt-3 whitespace-pre-wrap">{c.note}</p>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <h2 className="text-sm text-neutral-400 mb-4 tracking-wide">recent public drops</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
