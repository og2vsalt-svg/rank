import { motion } from 'framer-motion';

const items = [
  { title: 'tarn look', body: 'peek a live share id, sit with the facts, copy the discord /s card. quiet water, not a feed.' },
  { title: 'weir run', body: 'feed a pile through in order. each file gets a numbered name, a public drop, and its own embed.' },
  { title: 'ketch sail', body: 'caption a local file, publish it, copy the discord /s card. not a vault grid.' },
  { title: 'wake stamp', body: 'tag a local file with a short phrase, publish it, copy the discord /s card. not a vault grid.' },
  { title: 'flume run', body: 'feed a pile through in order. each file gets its own public drop and embed.' },
  { title: 'corrie look', body: 'look up a live share id, sit with the facts, copy the discord card. quiet hollow, not a feed.' },
  { title: 'skiff dock', body: 'one local file onto the share db. discord /s card comes back. not a vault grid.' },
  { title: 'jetty pile', body: 'tie a pile of local files to the dock. each one gets its own public drop and embed.' },
  { title: 'cloister read', body: 'look up a live share id and sit with the metadata. quiet room, not a feed.' },
  { title: 'mullion pane', body: 'preview on one side, facts on the other, then publish. discord still uses /s.' },
  { title: 'pier dock', body: 'ship one local file straight into the share db. discord /s card comes back. not a vault grid.' },
  { title: 'folio cover', body: 'give a drop a title, publish one local file to the share db, copy the discord /s card.' },
  { title: 'whet names', body: 'preview cleaned filenames on device. no upload. tidy cards before you share.' },
  { title: 'mason bricks', body: 'publish a pile as separate public drops. each brick gets its own /s embed.' },
  { title: 'rafter glance', body: 'see how heavy this origin is. no cap, just a slowness warning when storage is stuffed.' },
  { title: 'gilt card', body: 'look up a live share id and copy a discord-ready /s link with metadata.' },
  { title: 'gnomon desk', body: 'read last-modified, type, and size of a local file, then publish it to the share db with a discord /s card.' },
  { title: 'laneway aliases', body: 'pin short names to live share ids. stays in this browser. discord still uses /s/id.' },
  { title: 'thimble note', body: 'type a tiny thing, drop it as a public .txt. not a vault grid.' },
  { title: 'kindling desk', body: 'attach a spark note to a local file, publish it to the share db, copy the discord /s card.' },
  { title: 'nave aisle', body: 'sign a drop if you want, then send one local file public. not another vault grid.' },
  { title: 'spur peek', body: 'look up a live share id and get metadata plus the embed url without opening the bytes.' },
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
  { title: 'discord embeds', body: '/s/id and the rest of the short paths serve og tags so discord previews look finished.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'quay dock', body: 'drop a pile at once. each file gets its own discord /s embed from the share db.' },
  { title: 'relay slip', body: 'attach a note to a local file and hand it across as a public drop.' },
  { title: 'zenith board', body: 'a map of the rooms that are not just another vault grid.' },
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
