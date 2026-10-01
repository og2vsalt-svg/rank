import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function noiseBuffer(ctx: AudioContext, seconds = 2) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export default function PergolaPage() {
  const [on, setOn] = useState(false);
  const [rain, setRain] = useState(0.35);
  const [wind, setWind] = useState(0.18);
  const [hum, setHum] = useState(0.12);
  const ctxRef = useRef<AudioContext | null>(null);
  const gains = useRef<{ rain?: GainNode; wind?: GainNode; hum?: GainNode }>({});

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  const start = async () => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = ctxRef.current || new AudioCtx();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();

    const makeLoop = (filterType: BiquadFilterType, freq: number, gainVal: number) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 3);
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = gainVal;
      src.connect(filter).connect(g).connect(ctx.destination);
      src.start();
      return g;
    };

    if (!gains.current.rain) {
      gains.current.rain = makeLoop('lowpass', 900, rain);
      gains.current.wind = makeLoop('bandpass', 420, wind);
      gains.current.hum = makeLoop('lowpass', 120, hum);
    }
    setOn(true);
  };

  useEffect(() => {
    if (gains.current.rain) gains.current.rain.gain.value = rain;
    if (gains.current.wind) gains.current.wind.gain.value = wind;
    if (gains.current.hum) gains.current.hum.gain.value = hum;
  }, [rain, wind, hum]);

  const stop = () => {
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    gains.current = {};
    setOn(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">pergola</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a shade of sound</h1>
          <p className="text-sm text-neutral-500 mb-6">not a vault. three layers of noise stay in this tab so you can think. nothing is uploaded.</p>
          <div className="space-y-5">
            {[
              ['rain', rain, setRain],
              ['wind', wind, setWind],
              ['hum', hum, setHum],
            ].map(([label, val, set]) => (
              <label key={label as string} className="block">
                <span className="text-xs text-neutral-400 uppercase tracking-wide">{label as string}</span>
                <input type="range" min={0} max={1} step={0.01} value={val as number} onChange={(e) => (set as any)(Number(e.target.value))} className="w-full mt-2 accent-[#0a84ff]" />
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-7">
            {!on ? (
              <button onClick={start} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">open the shade</button>
            ) : (
              <button onClick={stop} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">close it</button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
