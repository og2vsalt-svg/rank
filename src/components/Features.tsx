import { motion } from 'framer-motion';

const items = [
  { title: 'local-first vault', body: 'files live in your browser for this demo. nothing ships to a random box unless you copy a public link.' },
  { title: 'folders + favorites + pins', body: 'inbox by default. make folders, star keepers, pin the ones that should float to the top.' },
  { title: 'quiet share links', body: 'mark a file public and copy a hash link. optional expiry and a passcode so the drop dies or stays locked.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set, so the link works on another device.' },
  { title: 'discord embeds', body: '/s/id pages serve og tags so discord, slack, and x preview the filename and image like a real product.' },
  { title: 'snapshot desk', body: 'paste a screenshot straight into the vault and flip it public if you want.' },
  { title: 'sketch pad', body: 'scribble locally and download a png. not a vault clone, just a quiet pad.' },
  { title: 'echo', body: 'poke a host and see how long the tab waits. different lane from files.' },
  { title: 'markdown desk', body: 'split writer with a live preview. stays on this device.' },
  { title: 'gallery wall', body: 'drop stills onto a quiet grid. no account needed.' },
  { title: 'transfer desk', body: 'one-shot upload into the public shares table with a discord-ready /s/ link.' },
  { title: 'record desk', body: 'leave a voice memo in the tab. download it into the vault when you want it to live.' },
  { title: 'count + units', body: 'weigh text and flip file sizes without opening another tab.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when a file is so big the tab might feel sleepy.' },
  { title: 'apple-soft motion', body: 'springy buttons, glass cards, blur. supposed to feel like something a human actually designed.' },
  { title: 'json desk', body: 'pretty print or crush a blob without leaving the tab.' },
  { title: 'scratch board', body: 'inbox / doing / done cards that live only on this device.' },
  { title: 'clipboard stash', body: 'park snippets you keep losing. separate from the file vault.' },
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
