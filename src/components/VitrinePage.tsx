import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Share = {
  id: string;
  name: string;
  mime?: string;
  type?: string;
  size?: number;
  file_url?: string;
  url?: string;
  caption?: string;
  author?: string;
  created_at?: string;
};

type Parcel = {
  id: string;
  title?: string;
  note?: string;
  author?: string;
  items?: { name?: string; size?: number; mime?: string; file_url?: string }[];
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function VitrinePage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [s, p] = await Promise.all([
          fetch('/api/share?list=1').then((r) => r.json()).catch(() => ({ shares: [] })),
          fetch('/api/parcel').then((r) => r.json()).catch(() => []),
        ]);
        if (dead) return;
        setShares(Array.isArray(s) ? s : Array.isArray(s?.shares) ? s.shares : []);
        setParcels(Array.isArray(p) ? p : []);
      } catch {
        if (!dead) setErr('the shelf did not answer.');
      }
    })();
    return () => { dead = true; };
  }, []);

  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setCopied(url); } catch { setCopied(''); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">vitrine</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">what is already filed.</h1>
          <p className="text-neutral-400 text-sm mb-8">public drops and packs from the share database. paste a link in Discord and the card unfurls.</p>
          {err && <p className="text-red-300 text-sm mb-4">{err}</p>}
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-3">packs</h2>
          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {parcels.length === 0 && <p className="text-neutral-500 text-sm">no packs yet. satchel is where they start.</p>}
            {parcels.map((parcel) => {
              const href = `${location.origin}/parcel/${parcel.id}`;
              const shot = (parcel.items || []).find((it) => String(it.mime || '').startsWith('image/') && it.file_url);
              return (
                <button key={parcel.id} onClick={() => copy(href)} className="lift text-left glass rounded-[24px] p-4">
                  {shot?.file_url && <img src={shot.file_url} alt="" className="w-full h-36 object-cover rounded-2xl mb-3" />}
                  <p className="font-medium">{parcel.title || 'satchel'}</p>
                  <p className="text-neutral-400 text-sm">{parcel.note || `${parcel.items?.length || 0} files`}</p>
                  <p className="text-[#0a84ff] text-xs mt-2">{copied === href ? 'copied' : 'copy discord card'}</p>
                </button>
              );
            })}
          </div>
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-3">drops</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shares.map((share) => {
              const href = `${location.origin}/s/${share.id}`;
              const mime = share.mime || share.type || '';
              const image = mime.startsWith('image/') ? (share.file_url || share.url) : '';
              return (
                <button key={share.id} onClick={() => copy(href)} className="lift text-left glass rounded-[24px] p-4">
                  {image && <img src={image} alt="" className="w-full h-36 object-cover rounded-2xl mb-3" />}
                  <p className="font-medium truncate">{share.name}</p>
                  <p className="text-neutral-400 text-sm">{pretty(Number(share.size) || 0)}{share.caption ? ` · ${share.caption}` : ''}</p>
                  <p className="text-[#0a84ff] text-xs mt-2">{copied === href ? 'copied' : 'copy discord card'}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
