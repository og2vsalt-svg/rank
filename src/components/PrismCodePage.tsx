import { useState } from 'react';
import { motion } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function PrismCodePage() {
  const { navigate } = useRouter();
  const [code, setCode] = useState('// paste or type code\nconsole.log("quiet prism");');
  const [title, setTitle] = useState('Prism Snippet');
  const [caption, setCaption] = useState('shared from Prism Code');
  const [ext, setExt] = useState('js');
  const [color, setColor] = useState('#0A84FF');
  const [result, setResult] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    setPublishing(true);
    const blob = new Blob([code], { type: 'text/plain' });
    const file = new File([blob], `${title.replace(/\s+/g, '-')}.${ext}`, { type: 'text/plain' });
    try {
      const pub = await publishLocalFile(file, { caption, cardTitle: title, color });
      if (pub.ok && pub.id) {
        const url = shareUrls(pub.id).embed;
        setResult(url);
        navigator.clipboard.writeText(url);
      }
    } catch {}
    setPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-[#0A84FF] text-sm mb-2">prism code</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">shape a snippet, share it quietly.</h1>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto">Type or paste code. Set the Discord embed title, caption, and accent. Publish as a permanent share. Soft size warnings only.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <input value={title} onChange={e => setTitle(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="title" />
          <input value={caption} onChange={e => setCaption(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="caption" />
          <div className="flex gap-2">
            <select value={ext} onChange={e => setExt(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl px-3 py-3 text-sm outline-none">
              <option value="js">js</option>
              <option value="ts">ts</option>
              <option value="md">md</option>
              <option value="txt">txt</option>
              <option value="py">py</option>
            </select>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 rounded-2xl cursor-pointer bg-transparent border border-white/10" />
          </div>
        </div>

        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          className="w-full h-80 bg-[#0a0a0c] border border-white/10 rounded-3xl p-5 font-mono text-sm text-neutral-200 outline-none focus:border-[#0A84FF]/40 resize-none"
          spellCheck={false}
        />

        <div className="mt-6 flex items-center gap-4">
          <button onClick={publish} disabled={publishing} className="px-6 py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50">{publishing ? 'publishing…' : 'publish snippet'}</button>
          {result && <span className="text-xs text-neutral-400">link copied — Discord-ready</span>}
        </div>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 glass rounded-2xl p-4 text-sm break-all">{result}</motion.div>
        )}

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white">← back home</button>
      </div>
    </div>
  );
}
