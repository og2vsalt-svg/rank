import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function CairnPage() {
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [embed, setEmbed] = useState('');
  const [id, setId] = useState('');

  const onFile = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 32 * 1024 * 1024 ? 'heavy stone. encoding might lag this tab. no hard cap.' : '');
    try {
      const dataUrl = await readFile(file);
      const nid = 'cairn-' + Date.now().toString(36);
      const payload = JSON.stringify({
        kind: 'cairn',
        note: note.trim(),
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      const blob = new Blob([payload], { type: 'application/json' });
      const wrapper = new File([blob], `${file.name}.cairn.json`, { type: 'application/json' });
      const wrapUrl = await readFile(wrapper);
      const res = await publishShare({
        id: nid,
        name: wrapper.name,
        type: 'application/json',
        size: wrapper.size,
        dataUrl: wrapUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'cloud publish failed');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setId(res.id || nid);
      setEmbed(shareUrls(res.id || nid).embed);
    } catch (e: any) {
      setErr(e?.message || 'drop failed');
    } finally {
      setBusy(false);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">cairn</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">leave a marked stone.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. wrap a local file with a short note, publish the bundle to the share db, and drop the /s/ link in discord.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a note for whoever finds this"
            rows={3}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'stacking…' : 'pick a local file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {id && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500">discord embed</p>
              <p className="text-sm break-all text-white">{embed}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard.writeText(embed)} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">copy embed</button>
                <button onClick={() => navigate('share', id)} className="px-4 py-2 rounded-full bg-white/10 text-sm">open drop</button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#2b2d31]">
                <div className="h-1 bg-[#0a84ff]" />
                <div className="p-4">
                  <p className="text-[#00a8fc] text-sm font-medium">rankvault</p>
                  <p className="text-white text-base mt-1">{id} — cairn</p>
                  <p className="text-[#dbdee1] text-sm mt-1">{note || 'a quiet marked drop.'}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
