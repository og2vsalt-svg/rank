import { motion } from 'framer-motion';

const items = [
  { title: 'windlass', body: 'count 64kb turns on a local file, then haul up a coil ticket or the original. discord unfurls /s.' },
  { title: 'wellhead', body: 'surface a local file with a field note. ship a tiny ticket or the original. discord unfurls /s.' },
  { title: 'spool', body: 'wind several local notes into one thread, then publish a single .txt drop with a discord /s card.' },
  { title: 'whetstone', body: 'hone a filename locally, keep the bytes, ship a tidy public drop.' },
  { title: 'harbor', body: 'tie a pile to the dock and send each file out as its own share-db drop.' },
  { title: 'kiln', body: 'fire loose text until extra space falls away, then optionally publish a .txt drop with a discord /s card.' },
  { title: 'lodestone', body: 'paint a 1200×630 card from a local file. only the card goes to the share db so discord unfurls cleanly.' },
  { title: 'meridian', body: 'lay two locals on a line and see which cut is heavier. nothing uploads.' },
  { title: 'nook', body: 'pin live drop ids in this browser and copy their discord /s cards. not a vault grid.' },
  { title: 'pontoon pile', body: 'float several local files across. each one becomes its own public drop and discord /s card.' },
  { title: 'silt sieve', body: 'filter a pile by image, video, audio, or text, then settle one file into the share db.' },
  { title: 'latch phrase', body: 'optional pass on a public drop. friends need the phrase. discord still unfurls /s.' },
  { title: 'quay line', body: 'queue several locals and ship them one after another, each with its own embed path.' },
  { title: 'mosaic card', body: 'tile stills into a single jpeg, then drop that card into the share db.' },
  { title: 'ledger', body: 'read what already landed in supabase. not a vault — just the public log.' },
  { title: 'locket + relay', body: 'frame one still, or hand a file across with a clock. both mint discord cards.' },
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
  { title: 'discord embeds', body: '/s/id plus /f /x /d /go /open /card /link /v /y /q /l /embed /n /k /w /u all serve og tags so previews look finished.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'lanyard', body: 'hang a tag on a file and mint a named discord card.' },
  { title: 'oxbow', body: 'local reminder loop. no upload. come back when the bend is due.' },
  { title: 'quoin', body: 'wedge a caption under a file and ship it straight to the share db.' },
  { title: 'yarrow', body: 'cast a pile, keep the smallest stalk, publish only that one.' },
  { title: 'oscillo', body: 'decode audio in the tab and print a wave still for discord.' },
  { title: 'docket', body: 'label a local file, tag who filed it, ship it to the share db.' },
  { title: 'linotype', body: 'set a short notice as a 1200×630 card and publish the still.' },
  { title: 'gauge', body: 'inspect name, type, and size locally. nothing leaves the device.' },
  { title: 'helix', body: 'sha-256 a file in the tab, then publish only the receipt to the share db.' },
  { title: 'apron', body: 'a local scratch pad. no upload, no vault grid.' },
  { title: 'plumb', body: 'look up a public drop id and copy the discord /s card.' },
  { title: 'keystone', body: 'weigh a local file, pin a sha receipt or the original. discord unfurls /s.' },
  { title: 'tinderbox', body: 'preview the discord card then light a public drop.' },
  { title: 'metronome', body: 'keep time in the tab. no files, no upload.' },
  { title: 'orrery', body: 'a tiny solar-system clock for the desk. not a vault.' },
  { title: 'astrolabe', body: 'guess the sun\u2019s height from latitude and hour.' },
  { title: 'nocturne', body: 'a dim writing pad that stays on this device.' },
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
              transition={{ delay: Math.min(i, 12) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
