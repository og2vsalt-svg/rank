import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

type Line = { name: string; size: number; embed?: string; app?: string; err?: string };

export default function MooringPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [indexEmbed, setIndexEmbed] = useState('');

  const take = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    const total = files.reduce((s, f) => s + f.size, 0);
    setWarn(total > 12 * 1024 * 1024 ? 'heavy mooring. large piles may feel slow. no hard cap.' : '');
    setBusy(true);
    setIndexEmbed('');
    const out: Line[] = [];
    for (const file of files) {
      try {
        const dataUrl = await readAsDataUrl(file);
        const id = uid();
        const res = await publishShare({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: 'mooring',
        });
        if (!res.ok) throw new Error(res.error || 'publish failed');
        const urls = shareUrls(res.id || id);
        out.push({ name: file.name, size: file.size, embed: urls.embed, app: urls.app });
      } catch (e: any) {
        out.push({ name: file.name, size: file.size, err: e?.message || 'failed' });
      }
    }
    setLines(out);
    try {
      const manifest = out
        .map((l) => `${l.name}\t${pretty(l.size)}\t${l.embed || l.err || ''}`)
        .join('\n');
      const blob = new Blob([`rankvault mooring\n${manifest}\n`], { type: 'text/plain' });
      const file = new File([blob], 'mooring.txt', { type: 'text/plain' });
      const dataUrl = await readAsDataUrl(file);
      const id = 'moor-' + uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        author: 'mooring',
      });
      if (res.ok) {
        const urls = shareUrls(res.id || id);
        setIndexEmbed(urls.embed);
        try { await navigator.clipboard.writeText(urls.embed); } catch {}
      }
    } catch {}
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">mooring</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">tie several locals to one index card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            each file becomes its own public drop. a small manifest is published last so discord can unfurl a single /s card for the set.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => take(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'mooring…' : 'choose a pile'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {indexEmbed && <p className="text-xs text-neutral-400 mt-4 break-all">index embed (copied): {indexEmbed}</p>}
          <ul className="mt-6 space-y-3">
            {lines.map((l, i) => (
              <li key={i} className="text-sm text-neutral-300">
                <span className="text-white">{l.name}</span>
                <span className="text-neutral-500"> · {pretty(l.size)}</span>
                {l.err && <p className="text-red-400 text-xs">{l.err}</p>}
                {l.embed && <p className="text-xs text-neutral-500 break-all">{l.embed}</p>}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
