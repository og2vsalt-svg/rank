import { motion } from 'framer-motion';

const items = [
  { title: 'local-first vault', body: 'files live in your browser for this demo. nothing ships to a random box unless you copy a public link.' },
  { title: 'frost desk', body: 'blur a still on this device and download a png. not a vault clone.' },
  { title: 'grain desk', body: 'roll film grain in the tab. zero hosting.' },
  { title: 'quiet share links', body: 'mark a file public and copy a hash link. optional expiry and a passcode so the drop dies or stays locked.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set, so the link works on another device.' },
  { title: 'discord embeds', body: '/s/id and /e/page serve og tags so discord, slack, and x preview the filename like a real product.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when a file is so big the tab might feel sleepy.' },
  { title: 'apple-soft motion', body: 'springy buttons, glass cards, blur. supposed to feel like something a human actually designed.' },
  { title: 'nimbus batch', body: 'publish a whole pile at once and get discord-ready links. not the vault grid.' },
  { title: 'pulse + meridian', body: 'heartbeat counts of what you hold, plus a timezone stamp for when a drop actually landed.' },
];

export default function Features() {
  return (
    <section className="py-16 px-5" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">built for dropping files</h2>
        <p className="text-neutral-500 text-sm mb-8">a vault that feels like it belongs on a phone.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-3xl p-6 hover:-translate-y-0.5"
            >
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
