import { motion } from 'framer-motion';

const items = [
  { title: 'bumkin', body: 'a local file into the share table, plus a return-by. discord unfurls /bumkin and /s. slowness warning only.' },
  { title: 'apostle', body: 'a local file into the share table, plus a spoken line and a witness. discord unfurls /apostle and /s. slowness warning only.' },
  { title: 'knee', body: 'a local file into the share table, plus who it braces. discord unfurls /knee and /s. slowness warning only.' },
  { title: 'transom', body: 'weigh two shares already in the table. not a vault drawer. discord unfurls /transom.' },
  { title: 'futtock', body: 'a local file into the share table, plus a rib note and sha-256 in its own table. discord unfurls /futtock and /s. slowness warning only.' },
  { title: 'stringer', body: 'a short line beside a share that already landed. not a vault drawer. discord unfurls /stringer.' },
  { title: 'scupper', body: 'one local file into the share table, plus a drain note in its own table. discord unfurls /scupper and /s. slowness warning only.' },
  { title: 'counter', body: 'one local file into the share table, plus a countermark in its own table. discord unfurls /counter and /s. slowness warning only.' },
  { title: 'hounds', body: 'name a line, file a local drop into the hounds table, and paste /hounds in discord.' },
  { title: 'seizing', body: 'seize several local files onto one line. each lands in the hounds table with its own discord card.' },
  { title: 'sternpost', body: 'name a berth, pin a time, and file one local drop into the share table. discord unfurls /s and /sternpost. heavy files are warned, never refused.' },
  { title: 'breasthook', body: 'a three-line brief — problem, change, proof — filed as markdown. an optional local attachment rides along. not a vault drawer.' },
  { title: 'waybill', body: 'a destination, a note, and an optional local file. the file lands in the share table. the slip has its own table. discord unfurls /waybill and /s. slowness warning only.' },
  { title: 'telltale', body: 'a quiet check that the share database and waybill table are answering. paste /telltale for the card.' },
  { title: 'carling', body: 'several locals, then a markdown index of their discord cards. each file lands in the share table. slowness warning only.' },
  { title: 'deadwood', body: 'hash a local file in the tab, compare a pasted digest, and file only the receipt.' },
  { title: 'fashion', body: 'paint a 1200x630 cover and file the png so discord unfurls a real image. optional companion file.' },
  { title: 'stemson', body: 'send a local pile into the share database. each file gets a discord card. slowness warning only.' },
  { title: 'gammon', body: 'open a shared room, then drop local files into it. the room lives in the database, not the vault grid.' },
  { title: 'knighthead', body: 'hash a local file in the tab and file only the receipt so discord can unfurl the proof.' },
  { title: 'cathead', body: 'read the public share log and copy a discord card without opening the drawer.' },
  { title: 'sheave', body: 'several locals, one index card. each file lands in the share table, and discord unfurls the pack note. slowness warning only.' },
  { title: 'dolphin', body: 'record a take in the tab and file the clip. not a drawer, and not a size gate.' },
  { title: 'gudgeon', body: 'hinge two drafts in the tab. publish the line diff only if you want a discord card.' },
  { title: 'mooring', body: 'pick a local file, set a caption and accent, and land it in the share database. discord unfurls /s. slowness warning only.' },
  { title: 'bellows', body: 'a timed breath in the tab. file the session as a note if you want a card. not a drawer.' },
  { title: 'inkwell', body: 'draw a mark, then publish the png so discord gets an image card.' },
  { title: 'stamp', body: 'hash a local file in the tab, then publish the bytes to the share database. discord gets the /s card. slowness warning only.' },
  { title: 'courier', body: 'send several locals in one run. each becomes its own public row and its own unfurl.' },
  { title: 'lanyard', body: 'retouch the title, caption, and accent on a drop that is already filed. no second upload.' },
  { title: 'quire', body: 'a reading room for a public text drop. not another drawer.' },
  { title: 'inbox', body: 'hand a local file to the share database. discord unfurls /s. slowness warning only, no hard cap.' },
  { title: 'transept', body: 'four city clocks at the crossing. not a vault drawer. the page link still unfurls.' },
  { title: 'ambo', body: 'time a reading, then publish the markdown if you want a card.' },
  { title: 'sedilia', body: 'three seats of notes on this device. publish them as one public drop.' },
  { title: 'voussoir', body: 'set one local file in the public shares table, with a caption discord can unfurl. slowness warning only.' },
  { title: 'scotia', body: 'a stair of checkboxes. publish the list as markdown, not another vault drawer.' },
  { title: 'necking', body: 'reshape a line \u2014 title, slug, case \u2014 then ship the pane if you want a card.' },
  { title: 'abacus', body: 'time a passage at a calm reading pace. stays in the tab until you publish it.' },
  { title: 'volute', body: 'seat an address and a note on the links shelf. no files involved.' },
  { title: 'quoin', body: 'paint a 1200\u00d7630 corner card in the tab and file the png so discord unfurls cleanly.' },
  { title: 'soffit', body: 'count words on the underside of a draft, then hang a .txt drop. not a vault drawer.' },
  { title: 'taffrail', body: 'lean on the public rail and read supabase drops that already landed.' },
  { title: 'rondel', body: 'three lines that return as A B C A B A. the poem ships as a public card.' },
  { title: 'scuttle', body: 'open a hatch and send one local through to the share db. slowness warning only.' },
  { title: 'copse', body: 'sample a grove of colour from a still in the tab. publish only the palette json if you want a discord card.' },
  { title: 'riprap', body: 'break a passage into numbered stones and hang the markdown on the share db. not a vault drawer.' },
  { title: 'wicket', body: 'a spoken phrase locks a short note. the /s link still unfurls for discord.' },
  { title: 'leat', body: 'a timed writing channel. pour the draft into supabase when the water stops.' },
  { title: 'pergola', body: 'a shade of layered noise. stays in the tab. not a filing cabinet.' },
  { title: 'spinney', body: 'count words, letters, and syllables without sending a thing.' },
  { title: 'cameo', body: 'cut a still into a circle. publish the png only if you want a discord card.' },
  { title: 'holt', body: 'time a passage for reading or speaking. optional public .txt drop.' },
  { title: 'fathom', body: 'sound a local file with sha-256 in the tab, then hang the original on the share db. discord unfurls /s.' },
  { title: 'tannoy', body: 'hear a local clip as bars, then hang the original on the public board. discord unfurls /s.' },
  { title: 'sundial', body: 'a noon-stick from latitude and hour. stays in the tab.' },
  { title: 'parcel', body: 'tie a packing list of locals and ship only the manifesto.' },
  { title: 'millrace', body: 'send a local file down the channel into the share db. discord unfurls /s. not the vault grid.' },
  { title: 'lychgate', body: 'walk a pasted note out as a public .txt drop. a door, not a filing cabinet.' },
  { title: 'gantry', body: 'hoist a still in the tab, then publish the original when you are ready.' },
  { title: 'clew', body: 'wind three short notes into one thread and ship a single discord card.' },
  { title: 'meander', body: 'preview a still with its frame size, then dock the original in the share db. discord unfurls /s.' },
  { title: 'ford', body: 'weigh two locals in the tab and publish only the heavier crossing.' },
  { title: 'oriel', body: 'peek at name, type, and size locally. nothing uploads from this desk.' },
  { title: 'gesso', body: 'prime a 1200x630 card and file it so discord unfurls cleanly.' },
  { title: 'reliquary', body: 'keep a sha-256 of the thing. only the receipt goes public.' },
  { title: 'harbor', body: 'tie a pile to the dock and send each file out as its own share-db drop.' },
  { title: 'ledger', body: 'read what already landed in supabase. not a vault \u2014 just the public log.' },
  { title: 'local-first vault', body: 'files live in your browser first. nothing ships unless you flip a drop public.' },
  { title: 'cloud share db', body: 'public drops land in supabase, with vercel blob when a token is set.' },
  { title: 'discord embeds', body: '/s/id plus /p/page and named paths serve og tags so discord previews look finished. image cards only use real images.' },
  { title: 'no hard file cap', body: 'drop whatever size you want. we only warn when the tab might feel sleepy.' },
  { title: 'nocturne', body: 'a dim writing pad that stays on this device.' },
  { title: 'weft', body: 'weave several notes into one public .txt. discord unfurls /s.' },
  { title: 'thole', body: 'pin a sha-256 of a local file. share only the receipt if you want.' },
  { title: 'gimbal', body: 'rotate a still in the tab, then hang the leveled png.' },
  { title: 'trunnion', body: 'slice a local into a map. only the json goes public.' },
  { title: 'samphire', body: 'a field note \u2014 title, place, body \u2014 published as markdown.' },
  { title: 'strake', body: 'a running stamped log that launches as a .log drop.' },
];

export default function Features() {
  return (
    <section className="py-16 px-5" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">built for dropping files</h2>
        <p className="text-neutral-500 text-sm mb-8">a vault that feels like it belongs on a phone. not a ranking tool.</p>
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
