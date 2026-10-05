import { motion } from 'framer-motion';

const items = [
  { title: 'plinth', body: 'name a place, write a dedication, and the local file lands in the share table. discord unfurls /plinth and /s. slowness warning only. not a vault drawer.' },
  { title: 'corbel', body: 'write what a file is holding up, and who it carries. bytes land in the share table. discord unfurls /corbel and /s. large drops are warned, never refused.' },
  { title: 'vitrine', body: 'dress a Discord card before the file lands in the share table. no size gate, only a slowness note. /s unfurls the file.' },
  { title: 'pressmark', body: 'paint a 1200×630 cover in the tab and file the png so Discord has a real image. not a vault drawer.' },
  { title: 'trundle', body: 'a handoff slip for someone else. the local file lands in the share table. discord unfurls /trundle.' },
  { title: 'coping', body: 'a checklist beside an optional local file. discord unfurls /coping. older desks stay.' },
  { title: 'discord embeds', body: '/s/id plus named paths serve og tags so discord previews look finished. image cards only use real images.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
];

export default function Features() {
  return (
    <section className="py-16 px-5" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">built for dropping files</h2>
        <p className="text-neutral-500 text-sm mb-8">a quiet desk for files, notes, and handoffs. not a cabinet with a size gate. the older desks are still on their routes.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 hover:-translate-y-0.5">
              <h3 className="text-white font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
