import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

type Row = { name: string; size: number; id?: string; embed?: string; err?: string; warn?: string };

export default function PortagePage() {
  const { user, isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [pass, setPass] = useState('');
  const [warn, setWarn] = useState('');

  const run = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    const chunky = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(chunky ? 'one of these is huge. the tab might lag while it encodes. no hard cap.' : '');
    setBusy(true);
    const next: Row[] = [];
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
          lockPass: pass || undefined,
          author: user?.username,
        });
        if (!res.ok) {
          next.push({ name: file.name, size: file.size, err: res.error || 'publish failed' });
        } else {
          const urls = shareUrls(res.id || id);
          next.push({ name: file.name, size: file.size, id: res.id || id, embed: urls.embed, warn: res.warn });
        }
      } catch (e: any) {
        next.push({ name: file.name, size: file.size, err: e?.message || 'read failed' });
      }
    }
    setRows(next);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">portage</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">haul local files into the cloud.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pick a pile from your machine. each one lands in the public shares db with a discord-ready embed link. no size cap, just a slowness heads-up.
          </p>
          {!isLoggedIn && (
            <p className="text-xs text-neutral-500 mb-4">
              you can still publish anonymously. <button className="text-[#0a84ff]" onClick={() => navigate('login')}>log in</button> if you want your name on the drop.
            </p>
          )}
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="optional passcode"
            className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => run(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'hauling…' : 'drop a stack here'}</p>
            <p className="text-xs text-neutral-500 mt-2">uploads local bytes to supabase. discord unfurls /s/id.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {rows.length > 0 && (
            <ul className="mt-6 space-y-3">
              {rows.map((r) => (
                <li key={r.name + r.size} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-sm text-white truncate">{r.name}</p>
                  <p className="text-xs text-neutral-500">{pretty(r.size)}{r.warn ? ' · ' + r.warn : ''}</p>
                  {r.err && <p className="text-xs text-red-400 mt-1">{r.err}</p>}
                  {r.embed && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed!)}
                        className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
                      >
                        copy discord link
                      </button>
                      {r.id && (
                        <button onClick={() => navigate('share', r.id)} className="px-3 py-1.5 rounded-full bg-white/5 text-xs">
                          open
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
