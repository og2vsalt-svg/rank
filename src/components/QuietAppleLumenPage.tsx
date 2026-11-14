import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietAppleLumenPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  const heavy = useMemo(() => files.reduce((n, f) => n + f.size, 0) > 40 * 1024 * 1024, [files]);

  const send = async () => {
    if (!files.length) return;
    setBusy(true);
    setStatus('');
    setLinks([]);
    const next: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        author,
        caption: caption ? `${caption} · ${file.name}` : file.name,
        color,
        cardTitle: caption || file.name,
        meta: { accent: color, source: 'quietapplelumen' },
      });
      if (!res.ok) {
        setStatus(res.error || 'upload failed');
        break;
      }
      if (res.embed) next.push(res.embed);
    }
    setLinks(next);
    setFiles([]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }}>
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">quiet apple lumen</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-[-0.05em] text-white">soft light for what you share</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/65">
            Drop local files into a refined lumen of frosted glass. Gentle spring motion, Apple-style pacing, shared caption. Batch publish to the database. Every link unfurls a polished Discord embed. Large files warned for possible slowness, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <label className="glass mt-10 block cursor-pointer rounded-3xl p-10 text-center transition hover:bg-white/[0.03]">
          <input className="hidden" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          <div className="text-[16px] text-white/85">{files.length ? `${files.length} files ready to settle` : 'drop or choose local files'}</div>
          <div className="mt-2 text-[12px] text-white/40">any type · soft warning only</div>
        </label>

        {!!files.length && (
          <ul className="mt-5 space-y-1.5 text-[13px] text-white/60">
            {files.map((f) => (
              <li key={f.name + f.size} className="truncate rounded-xl bg-white/[0.03] px-3 py-2">{f.name}</li>
            ))}
          </ul>
        )}

        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared caption" className="mt-4 w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] outline-none focus:bg-white/[0.06]" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="mt-2 w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] outline-none focus:bg-white/[0.06]" />

        <div className="mt-3 flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
          <span className="text-[13px] text-white/50">lumen accent</span>
        </div>

        {heavy && <p className="mt-3 text-[13px] text-amber-200/80">large batch. sending may feel slow. nothing is refused.</p>}

        <motion.button
          whileTap={{ scale: 0.975 }}
          onClick={send}
          disabled={!files.length || busy}
          className="mt-5 w-full rounded-full px-5 py-3 text-[15px] font-medium text-white disabled:opacity-40"
          style={{ background: color }}
        >
          {busy ? 'settling into light…' : 'publish to the lumen'}
        </motion.button>

        {status && <p className="mt-3 text-[13px] text-red-300">{status}</p>}

        {links.length > 0 && (
          <div className="mt-6 space-y-2">
            {links.map((l) => (
              <a key={l} href={l} className="glass block rounded-2xl px-4 py-3 text-[12px] text-white/60 hover:text-white break-all">{l}</a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
