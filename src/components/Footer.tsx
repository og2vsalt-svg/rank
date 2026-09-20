import { useRouter } from './Router';

export default function Footer() {
  const { navigate } = useRouter();
  return (
    <footer className="border-t border-white/[0.04] py-8 px-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-semibold tracking-tight text-neutral-600">
          rank<span className="text-[#0a84ff]/70">vault</span>
        </span>
        <div className="flex gap-4 text-xs text-neutral-600">
          <button onClick={() => navigate('drop')}>drop</button>
          <button onClick={() => navigate('notes')}>notes</button>
          <button onClick={() => navigate('paste')}>paste</button>
          <button onClick={() => navigate('status')}>status</button>
        </div>
        <span className="text-xs text-neutral-700">
          &copy; {new Date().getFullYear()} rankvault
        </span>
      </div>
    </footer>
  );
}
