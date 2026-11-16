import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Keep = { id: string; file: File; note: string; preview?: string };

export default function QuietKeepsakePage() {
  const [keeps, setKeeps] = useState<Keep[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next: Keep[] = Array.from(list).map((file) => ({
      id: Math.random().toString(36).slice(2, 10),
      file,
      note: '',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setKeeps((k) => [...next, ...k]);
    const total = [...keeps, ...next].reduce((s, k) => s + k.file.size, 0);
    setWarn(total > 60 * 1024 * 1024 ? 'large keepsake. settling may feel slower. no hard limit.' : null);
  }, [keeps]);

  const updateNote = (id: string, note: string) => {
    setKeeps((k) => k.map((x) => (x.id === id ? { ...x, note } : x)));
  };

  const remove = (id: string) => {
    setKeeps((k) => {
      const found = k.find((x) => x.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return k.filter((x) => x.id !== id);
    });
  };

  const publish = async () => {
    if (!keeps.length) return;
    setBusy(true);
    setLinks([]);
    setWarn(null);
    const out: string[] = [];
    try {
      for (const k of keeps) {
        const caption = [sharedNote, k.note].filter(Boolean).join(' · ') || 'quiet keepsake';
        const res = await publishLocalFile(k.file, {
          caption,
          cardTitle: k.file.name,
          meta: { desk: 'quietkeepsake', personalNote: k.note || null },
        });
        if (res.ok && res.id) {
          out.push(shareUrls(res.id).embed);
        } else {
          setWarn(res.error || `failed on ${k.file.name}`);
          break;
        }
      }
      setLinks(out);
    } catch (e: any) {
      setWarn(e.message || 'could not publish');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-6 md:p-10 shadow-2xl"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Quiet Keepsake</h1>
          <p className="text-neutral-400 text-sm mb-8">Drop files that matter. Give each a short personal note. They settle into the database with polished Discord embeds. Soft warnings only.</p>

          <div
            className="relative w-full min-h-[140px] bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById('keepsake-input')?.click()}
          >
            <p className="text-neutral-500 text-sm">drop or click for keepsakes</p>
            <input
              id="keepsake-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <input
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="shared note for the collection"
            className="w-full mb-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
          />

          <div className="space-y-4 mb-6">
            <AnimatePresence>
              {keeps.map((k) => (
                <motion.div
                  key={k.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex gap-3">
                    {k.preview && (
                      <img src={k.preview} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{k.file.name}</p>
                      <p className="text-xs text-neutral-500 mb-2">{(k.file.size / 1024 / 1024).toFixed(1)} MB</p>
                      <input
                        value={k.note}
                        onChange={(e) => updateNote(k.id, e.target.value)}
                        placeholder="personal note for this one"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                      />
                    </div>
                    <button onClick={() => remove(k.id)} className="text-neutral-500 hover:text-white text-sm self-start">
                      remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={publish}
            disabled={busy || !keeps.length}
            className="w-full py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-neutral-100 disabled:opacity-50 transition"
          >
            {busy ? 'settling keepsakes…' : `publish ${keeps.length} keepsake${keeps.length === 1 ? '' : 's'}`}
          </button>

          {links.length > 0 && (
            <div className="mt-4 space-y-1">
              {links.map((l) => (
                <a key={l} href={l} target="_blank" rel="noreferrer" className="block text-sm text-blue-400 hover:underline truncate">
                  {l}
                </a>
              ))}
            </div>
          )}
          {warn && <p className="mt-4 text-xs text-amber-400 text-center">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
