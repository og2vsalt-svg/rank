import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

export default function TandemPage() {
  const { addFiles, togglePublic } = useVault();
  const { navigate } = useRouter();
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [ids, setIds] = useState<string[]>([]);

  const pick = (which: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (f.size > 40 * 1024 * 1024) setWarn('chunky pair. encoding may lag. no cap tho.');
    if (which === 'a') setA(f);
    else setB(f);
  };

  const publish = async () => {
    if (!a || !b) {
      setErr('need two local files');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const dt = new DataTransfer();
      dt.items.add(a);
      dt.items.add(b);
      const result = await addFiles(dt.files, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'could not save');
        return;
      }
      const published: string[] = [];
      for (const id of result.ids || []) {
        const pub = await togglePublic(id);
        if (pub.ok) published.push(id);
      }
      setIds(published);
    } catch (e: any) {
      setErr(e?.message || 'tandem failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">tandem</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">two files. one trip.</h1>
          <p className="text-neutral-400 text-sm mb-7">not a vault clone. pick a pair from your machine, publish both to the cloud db, grab two discord-ready links.</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <label className="rounded-[22px] border border-dashed border-white/15 p-6 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
              <input type="file" className="hidden" onChange={(e) => pick('a', e.target.files)} />
              <p className="text-sm text-white">{a ? a.name : 'left file'}</p>
              <p className="text-[11px] text-neutral-500 mt-1">{a ? Math.round(a.size / 1024) + ' kb' : 'click to pick'}</p>
            </label>
            <label className="rounded-[22px] border border-dashed border-white/15 p-6 text-center cursor-pointer hover:border-[#0a84ff]/40 transition">
              <input type="file" className="hidden" onChange={(e) => pick('b', e.target.files)} />
              <p className="text-sm text-white">{b ? b.name : 'right file'}</p>
              <p className="text-[11px] text-neutral-500 mt-1">{b ? Math.round(b.size / 1024) + ' kb' : 'click to pick'}</p>
            </label>
          </div>
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'publishing…' : 'publish pair'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {ids.length > 0 && (
            <div className="mt-6 space-y-2">
              {ids.map((id) => (
                <button key={id} onClick={() => navigate('share', id)} className="block text-left text-xs text-neutral-400 hover:text-white break-all">
                  {shareUrls(id).embed}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
