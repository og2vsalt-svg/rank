import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

type Shot = { id: string; name: string; size: number; type: string; url: string };

export default function MicaPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [hint, setHint] = useState('');

  const total = useMemo(() => shots.reduce((s, x) => s + x.size, 0), [shots]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const weight = files.reduce((s, f) => s + f.size, 0);
    setHint(weight > 60 * 1024 * 1024 ? 'previews stay in-tab. huge stacks can feel laggy.' : '');
    const next = files.map((file) => ({
      id: file.name + file.size + file.lastModified,
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      url: URL.createObjectURL(file),
    }));
    setShots((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return next;
    });
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">mica</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">local contact sheet.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            nothing leaves this tab. inspect a pile of images or clips before you bother hosting them.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">pick images or clips</p>
            <p className="text-xs text-neutral-500 mt-2">stays on device. no upload.</p>
          </label>
          {hint && <p className="text-xs text-amber-300/80 mt-4">{hint}</p>}
          {shots.length > 0 && (
            <>
              <p className="text-xs text-neutral-500 mt-6 mb-3">
                {shots.length} items · {formatBytes(total)}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shots.map((s) => (
                  <div key={s.id} className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                    {s.type.startsWith('video/') ? (
                      <video src={s.url} className="w-full h-32 object-cover" muted playsInline controls />
                    ) : (
                      <img src={s.url} alt={s.name} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="text-xs text-white truncate">{s.name}</p>
                      <p className="text-[11px] text-neutral-500 mt-1">{formatBytes(s.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
