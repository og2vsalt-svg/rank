import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function MeridianPage() {
  const { addFiles, togglePublic } = useVault();
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const zones = useMemo(
    () =>
      [
        'Pacific/Honolulu',
        'America/Los_Angeles',
        'America/New_York',
        'Europe/London',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Australia/Sydney',
      ].map((z) => ({
        z,
        t: new Intl.DateTimeFormat('en', { timeZone: z, hour: '2-digit', minute: '2-digit', weekday: 'short' }).format(new Date()),
      })),
    [],
  );

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const big = [...list].some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'chunky file. encoding might feel slow. no hard cap.' : '');
    setErr('');
    setLink('');
    setBusy(true);
    try {
      const result = await addFiles(list, 'inbox');
      if (!result.ok) {
        setErr(result.error || 'need to be logged in');
        return;
      }
      const id = result.ids?.[0];
      if (!id) return;
      const pub = await togglePublic(id);
      if (!pub.ok) {
        setErr(pub.error || 'publish failed');
        return;
      }
      setLink(shareUrls(id).embed);
      try {
        await navigator.clipboard.writeText(shareUrls(id).embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">meridian</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">drop against the clock.</h1>
          <p className="text-neutral-400 text-sm mb-6">see a few timezones, leave a caption, send one local file to the share db.</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {zones.map((z) => (
              <div key={z.z} className="rounded-2xl bg-white/[0.03] border border-white/5 px-3 py-3">
                <p className="text-[11px] text-neutral-500 truncate">{z.z.split('/')[1]?.replace('_', ' ')}</p>
                <p className="text-sm text-white">{z.t}</p>
              </div>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional caption (stays on this page)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none min-h-[80px] mb-4"
          />
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center">
            <input type="file" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-white text-sm">{busy ? 'publishing…' : 'drop one file'}</p>
            <p className="text-[11px] text-neutral-500 mt-1">no file cap. just a slowness warning.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
