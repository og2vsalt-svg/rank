import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function StudioDropPage() {
  const { addFiles } = useVault();
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLocal = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
    next.forEach((f) => {
      if (f.size > 40 * 1024 * 1024) setStatus('large file noted — upload continues, may feel slow');
    });
  };

  const publishAll = async () => {
    if (!files.length) return;
    setStatus('publishing…');
    const out: string[] = [];
    for (const f of files) {
      const res = await publishLocalFile(f, { caption: captions[f.name] || '', cardTitle: f.name });
      if (res.ok && res.id) {
        out.push(shareUrls(res.id).app);
        await addFiles([f], 'studio');
      }
    }
    setLinks(out);
    setStatus(out.length ? `shared ${out.length} file${out.length > 1 ? 's' : ''}` : 'none succeeded');
  };

  return (
    <div className="min-h-screen mesh text-white">
      <Navbar />
      <div className="pt-28 pb-16 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0A84FF] text-sm font-medium mb-2">studio drop</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">batch the shares.</h1>
          <p className="text-neutral-400 mb-8 max-w-lg">
            Drop several local files, caption them, publish each to the database. Every link gets a professional Discord embed. No size gates.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addLocal(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className="glass rounded-3xl p-10 text-center cursor-pointer apple-card mb-6"
          >
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addLocal(e.target.files)} />
            <p className="font-medium">drop files or click</p>
            <p className="text-xs text-neutral-500 mt-1">multiple ok · large ones only warn</p>
          </div>

          <AnimatePresence>
            {files.map((f) => (
              <motion.div
                key={f.name + f.size}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                className="glass rounded-2xl p-4 mb-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{f.name}</p>
                  <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  <input
                    value={captions[f.name] || ''}
                    onChange={(e) => setCaptions((c) => ({ ...c, [f.name]: e.target.value }))}
                    placeholder="caption"
                    className="mt-2 w-full bg-white/5 rounded-xl px-3 py-1.5 text-xs outline-none"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {files.length > 0 && (
            <button
              onClick={publishAll}
              className="w-full py-3 rounded-full bg-[#0A84FF] font-medium hover:bg-[#409CFF] active:scale-[0.98] transition"
            >
              publish all
            </button>
          )}

          {status && <p className="text-xs text-neutral-400 mt-4">{status}</p>}
          {links.length > 0 && (
            <div className="mt-4 space-y-2">
              {links.map((l) => (
                <a key={l} href={l} className="block text-xs text-[#0A84FF] break-all hover:underline">{l}</a>
              ))}
            </div>
          )}

          <button onClick={() => navigate('home')} className="mt-10 text-sm text-neutral-500 hover:text-white">
            ← home
          </button>
        </motion.div>
      </div>
    </div>
  );
}
