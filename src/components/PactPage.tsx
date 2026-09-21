import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default function PactPage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [id, setId] = useState('');

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setErr('');
    setLink('');
    const files = [...list];
    const total = files.reduce((n, f) => n + f.size, 0);
    setWarn(total > 12 * 1024 * 1024 ? 'pack is chunky. encode + upload may feel slow. no hard cap.' : '');
    try {
      const items = [];
      for (const file of files) {
        const dataUrl = await readAsDataURLSafe(file);
        const fid = uid();
        const pub = await publishShare({
          id: fid,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        });
        if (!pub.ok) throw new Error(pub.error || 'item publish failed');
        items.push({ id: fid, name: file.name, type: file.type, size: file.size });
      }
      const packId = uid();
      const pack = {
        kind: 'pact',
        createdAt: new Date().toISOString(),
        items,
      };
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
      const packFile = new File([blob], 'pact.json', { type: 'application/json' });
      const packData = await readAsDataURLSafe(packFile);
      const pubPack = await publishShare({
        id: packId,
        name: `pact-${items.length}.json`,
        type: 'application/json',
        size: packFile.size,
        dataUrl: packData,
      });
      if (!pubPack.ok) throw new Error(pubPack.error || 'pack publish failed');
      setId(packId);
      setLink(shareUrls(packId).app);
    } catch (e: any) {
      setErr(e?.message || 'pact failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pact</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">bundle local files into one cloud pack.</h1>
          <p className="text-sm text-neutral-500 mb-6">each file goes to the share db, then a pact json ties them together. discord embed lives on /s/id.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'publishing pack…' : 'pick a handful of files'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-400 break-all">{link}</p>
              <button onClick={() => navigate('share', id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open pack share</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

async function readAsDataURLSafe(file: File) {
  return readAsDataUrl(file);
}
