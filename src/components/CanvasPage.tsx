import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';
import { useVault } from './VaultContext';
import Navbar from './Navbar';

export default function CanvasPage() {
  const { isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const { files, addFiles } = useVault();
  const [items, setItems] = useState<{id: string; x: number; y: number; file: any}[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const list = e.dataTransfer.files;
    if (!list.length) return;
    const res = await addFiles(list, 'canvas');
    if (res.ok) {
      const newItems = Array.from(list).map((f, i) => ({
        id: Date.now() + '-' + i,
        x: 50 + Math.random() * 200,
        y: 50 + Math.random() * 200,
        file: { name: f.name, type: f.type, size: f.size, dataUrl: URL.createObjectURL(f) }
      }));
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-5 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[#0A84FF] text-sm font-medium mb-2 tracking-wide">canvas</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">visual file canvas.</h1>
          <p className="text-neutral-400 max-w-xl">Drop files onto the canvas. Arrange them freely. Share the whole board or individual pieces. No size limits — large files just get a gentle note.</p>
        </motion.div>

        {!isLoggedIn ? (
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-lg text-white mb-2">sign in to use the canvas</p>
            <button onClick={() => navigate('login')} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">log in</button>
          </div>
        ) : (
          <div
            ref={canvasRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative min-h-[520px] rounded-3xl glass border-2 border-dashed transition-colors ${dragOver ? 'border-[#0A84FF]/60 bg-[#0A84FF]/5' : 'border-white/10'}`}
          >
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  drag
                  dragMomentum={false}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute glass rounded-2xl p-3 w-40 cursor-grab active:cursor-grabbing shadow-lg"
                  style={{ left: item.x, top: item.y }}
                >
                  {item.file.type.startsWith('image/') ? (
                    <img src={item.file.dataUrl} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                  ) : (
                    <div className="w-full h-24 rounded-xl bg-black/30 flex items-center justify-center mb-2 text-xs text-neutral-400">file</div>
                  )}
                  <p className="text-xs truncate text-white">{item.file.name}</p>
                  <p className="text-[10px] text-neutral-500">{(item.file.size / 1024).toFixed(0)} kb</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm pointer-events-none">
                drop files here to arrange on the canvas
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
