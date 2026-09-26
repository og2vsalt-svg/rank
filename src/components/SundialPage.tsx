import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function SundialPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hours, setHours] = useState(24);
  const [warn, setWarn] = useState('');

  const expiry = useMemo(() => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    return d.toISOString();
  }, [hours]);

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setWarn(f.size > 40 * 1024 * 1024 ? 'big file. previews and encoding will feel slow. still allowed.' : '');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">sundial</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">set how long a drop should live.</h1>
          <p className="text-neutral-400 text-sm mb-6">this desk only plans the expiry stamp. drop the file from vault or harvest when you are ready.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-8 text-center mb-6">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white text-sm">{file ? file.name : 'pick a local file to inspect'}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">{pretty(file.size)} · {file.type || 'unknown type'}</p>}
          </label>
          <label className="block text-xs text-neutral-400 mb-2">hours until expire</label>
          <input
            type="range"
            min={1}
            max={168}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full accent-[#0a84ff]"
          />
          <p className="text-sm text-white mt-3">{hours} hours · utc {expiry}</p>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          <p className="text-xs text-neutral-500 mt-6">pass this iso stamp as expiresAt when you publish. share links still get discord og cards.</p>
        </motion.div>
      </div>
    </div>
  );
}
