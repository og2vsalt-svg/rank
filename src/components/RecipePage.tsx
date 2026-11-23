import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function RecipePage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPhoto = (file: File | null) => {
    setPhoto(file);
    setPreview(file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    setWarn(file && file.size > 40_000_000 ? 'Large photo may take a moment. No hard limits.' : null);
  };

  const publish = async () => {
    if (busy || !title.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const recipeText = [
        `# ${title.trim()}`,
        '',
        '## Ingredients',
        ingredients.trim() || '(none listed)',
        '',
        '## Instructions',
        instructions.trim() || '(none listed)',
      ].join('\n');

      let fileToUpload: File;
      let caption = recipeText;
      let cardTitle = title.trim();

      if (photo) {
        fileToUpload = photo;
      } else {
        // pure text recipe as markdown file
        const blob = new Blob([recipeText], { type: 'text/markdown' });
        fileToUpload = new File([blob], `${title.trim().replace(/\s+/g, '-')}.md`, { type: 'text/markdown' });
        caption = `Recipe: ${title.trim()}`;
      }

      const res = await publishLocalFile(fileToUpload, {
        caption,
        color: '#FF9500',
        cardTitle,
        meta: { desk: 'recipe', title: title.trim() },
      });

      if (res.ok && res.id) {
        const link = shareUrls(res.id).app;
        setResult({ link });
      } else {
        setResult({ error: res.error || 'Could not publish' });
      }
    } catch (e: any) {
      setResult({ error: e.message || 'Something went wrong' });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#FF9500] mb-2">Recipe</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Share a recipe.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Title, ingredients, steps, and an optional photo. Publishes as a permanent share with polished Discord embeds. Soft size warnings only.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Ingredients (one per line)"
            rows={5}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions"
            rows={6}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-8 text-center mb-5 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-2xl object-cover" />
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Optional photo</p>
                <p className="text-neutral-500 text-sm mt-1">click to add</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPhoto(e.target.files?.[0] || null)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !title.trim()}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#FF9500]"
          >
            {busy ? 'Publishing…' : 'Share recipe'}
          </motion.button>

          {result?.link && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-4 text-center"
            >
              <p className="text-sm text-neutral-300 mb-2">Shared</p>
              <button
                onClick={() => navigate('share', result.link!.split('/').pop() || '')}
                className="text-[#FF9500] text-sm break-all"
              >
                {result.link}
              </button>
            </motion.div>
          )}
          {result?.error && (
            <p className="mt-4 text-sm text-red-400">{result.error}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
