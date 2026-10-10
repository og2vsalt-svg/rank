import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

const COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#BF5AF2', '#64D2FF', '#1D1D1F'];

export default function StudioPage() {
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState('');
  const [result, setResult] = useState<{ id: string; embed: string } | null>(null);

  const previewTitle = title || (file ? file.name : 'your file');
  const previewDesc = caption || 'shared from rankvault studio';

  const onSelect = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ''));
    setWarn(f.size > 40 * 1024 * 1024 ? 'Large file detected. Upload will proceed — it may feel slow in the browser.' : '');
    setResult(null);
  };

  const share = async () => {
    if (!file) return;
    setUploading(true);
    const res = await publishLocalFile(file, {
      caption,
      cardTitle: title || undefined,
      color,
    });
    setUploading(false);
    if (res.ok && res.id) {
      setResult({ id: res.id, embed: shareUrls(res.id).embed });
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">studio</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
            craft the perfect share.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed">
            Upload any local file. Shape the Discord card with a custom title, caption, and color. No size limits — only a gentle warning if things get heavy.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="space-y-6"
          >
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 text-center cursor-pointer hover:border-white/20 transition-all active:scale-[0.99]"
            >
              <div className="text-4xl mb-3">↓</div>
              <p className="font-medium mb-1">{file ? file.name : 'drop or choose a file'}</p>
              <p className="text-sm text-neutral-500">
                {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'any type, any size'}
              </p>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => onSelect(e.target.files)} />
            </div>

            {warn && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300 text-sm text-center">
                {warn}
              </motion.p>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">card title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="what people see first"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50 transition"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">caption</span>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="a short note for the embed"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
                />
              </label>
              <div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">accent</span>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={share}
              disabled={!file || uploading}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium text-sm hover:bg-[#409CFF] active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {uploading ? 'crafting…' : 'create share'}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="sticky top-28"
          >
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">discord preview</p>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1c1c1e] shadow-2xl">
              <div className="h-1.5" style={{ background: color }} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400">
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                  rankvault
                </div>
                <h3 className="font-semibold text-[15px] leading-snug mb-1">{previewTitle}</h3>
                <p className="text-[13px] text-neutral-400 line-clamp-2">{previewDesc}</p>
                {file && <p className="text-[11px] text-neutral-500 mt-2">{file.name}</p>}
              </div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10"
                >
                  <p className="text-sm text-neutral-300 mb-3">ready to share</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={result.embed}
                      className="flex-1 bg-black/40 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={() => copy(result.embed)}
                      className="px-4 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-neutral-200 active:scale-95"
                    >
                      copy
                    </button>
                  </div>
                  <button
                    onClick={() => navigate('s', result.id)}
                    className="mt-3 text-xs text-[#0A84FF] hover:underline"
                  >
                    open the share →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
