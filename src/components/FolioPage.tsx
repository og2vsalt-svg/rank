import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Shot = { file: File; preview: string; id?: string; embed?: string; error?: string };

export default function FolioPage() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  useEffect(() => () => shots.forEach((s) => URL.revokeObjectURL(s.preview)), [shots]);

  const take = (list: FileList | null) => {
    const images = Array.from(list || []).filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|heic)$/i.test(f.name));
    const bytes = images.reduce((n, f) => n + f.size, 0);
    setWarn(bytes > 30 * 1024 * 1024 ? 'heavy stills. previews and upload may stutter. no size lock.' : '');
    setShots(images.map((file) => ({ file, preview: URL.createObjectURL(file) })));
  };

  const send = async () => {
    if (!shots.length) return;
    setBusy(true);
    const next = [...shots];
    for (let i = 0; i < next.length; i++) {
      const res = await publishLocalFile(next[i].file, { author, caption: 'folio still' });
      next[i] = {
        ...next[i],
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
      };
      setShots([...next]);
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">folio</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">a contact sheet that leaves the tab</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            Stills stay on this machine until you publish. Each one becomes a public drop, and Discord can show the image on the /s card because the embed reads the file url.
          </p>
        </motion.div>

        <label className="glass mt-8 block cursor-pointer rounded-3xl p-8 text-center">
          <input className="hidden" type="file" accept="image/*" multiple onChange={(e) => take(e.target.files)} />
          <div className="text-[15px] text-white/80">{shots.length ? `${shots.length} stills on the sheet` : 'choose images'}</div>
        </label>
        {warn && <p className="mt-3 text-[13px] text-amber-200/80">{warn}</p>}

        {!!shots.length && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shots.map((s) => (
              <motion.figure key={s.preview} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-2xl bg-white/5">
                <img src={s.preview} alt="" className="aspect-square w-full object-cover" />
                <figcaption className="px-3 py-2 text-[12px] text-white/55">
                  <span className="block truncate">{s.file.name}</span>
                  {s.embed ? <a className="text-[#0A84FF]" href={s.embed}>{s.embed.replace(/^https?:\/\//, '')}</a> : s.error ? <span className="text-red-300">{s.error}</span> : <span>waiting</span>}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}

        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name on the cards, optional" className="glass mt-4 w-full rounded-2xl px-4 py-3 text-[14px] outline-none" />
        <button onClick={send} disabled={!shots.length || busy} className="mt-4 w-full rounded-full bg-white px-4 py-3 text-[15px] font-medium text-black disabled:opacity-40">
          {busy ? 'publishing stills…' : 'publish the sheet'}
        </button>
      </main>
    </div>
  );
}
