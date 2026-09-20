import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from './Router';
import { useVault } from './VaultContext';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function SharePage() {
  const { shareId, navigate } = useRouter();
  const { getPublicFile, bumpDownload } = useVault();
  const file = shareId ? getPublicFile(shareId) : undefined;
  const [pass, setPass] = useState('');
  const [ok, setOk] = useState(false);
  const locked = !!(file && file.lockPass && !ok);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          {!file ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">share</p>
              <h1 className="text-3xl font-semibold mb-3">this link is private, expired, or gone.</h1>
              <p className="text-neutral-400 mb-6">either it was never marked public, the timer ran out, or it lives on another device. vault files stay local in this demo.</p>
              <button onClick={() => navigate('vault')} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open vault</button>
            </>
          ) : locked ? (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">locked drop</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">{file.name}</h1>
              <p className="text-sm text-neutral-500 mb-5">this share has a passcode. type it to peek.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pass === file.lockPass) setOk(true);
                }}
                className="flex gap-2"
              >
                <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="passcode" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
                <button type="submit" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">unlock</button>
              </form>
            </>
          ) : (
            <>
              <p className="text-[#0a84ff] text-sm mb-2">public drop</p>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">{file.name}</h1>
              <p className="text-sm text-neutral-500 mb-6">{formatBytes(file.size)} · {file.type || 'file'} · {file.downloads} downloads{file.expiresAt ? ' · expires ' + new Date(file.expiresAt).toLocaleString() : ''}</p>
              {file.type.startsWith('image/') && <img src={file.dataUrl} alt="" className="w-full rounded-2xl mb-6" />}
              {file.type.startsWith('video/') && <video src={file.dataUrl} controls className="w-full rounded-2xl mb-6" />}
              {file.type.startsWith('audio/') && <audio src={file.dataUrl} controls className="w-full mb-6" />}
              <a
                href={file.dataUrl}
                download={file.name}
                onClick={() => bumpDownload(file.id)}
                className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
              >
                download
              </a>
            </>
          )}
        </motion.div>
      </div>
    </n>
  );
}
