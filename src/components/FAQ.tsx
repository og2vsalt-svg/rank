import { useState } from 'react';

const faqs = [
  {
    q: 'How do I order?',
    a: "Create an account, add what you want to your cart, pick your boost type and payment method, then hit Submit. Your order gets sent straight to me automatically. Then hop in the Discord so we can sort out payment and get started.",
  },
  {
    q: 'Is my account safe?',
    a: "Yes. If you go with an account boost, I use a VPN matched to your region and never share your info with anyone. Your credentials stay between us.",
  },
  {
    q: 'What is the difference between duo and account boost?',
    a: "Duo means I party up with you and we play together on your account. Account boost means you share your login and I play on it directly. Duo lets you watch and learn, account boost is faster and hands-off.",
  },
  {
    q: 'How long does a boost take?',
    a: "Every item in the pricing section shows an estimated delivery time. Smaller boosts can be done in a few hours. Bigger orders like a full rank run or 500+ levels can take multiple days. The cart will warn you if your order is large. I always give you an honest ETA before you pay.",
  },
  {
    q: 'How do I pay?',
    a: "PayPal or crypto (BTC, ETH, LTC, SOL). You pick which one when you submit your order, then we sort out the details on Discord.",
  },
  {
    q: 'Do you do refunds?',
    a: "If I cannot complete your order for any reason, full refund. No questions asked.",
  },
  {
    q: 'Can I order multiple things at once?',
    a: "Yes, just add everything to your cart. If you are combining a rank boost with levels or wins, mention you want the bundle discount and I will apply it.",
  },
  {
    q: 'Do I need an account to order?',
    a: "Yes, you need to sign up so I know who the order is from. It only takes a few seconds.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm text-white font-medium pr-4 group-hover:text-green-400 transition-colors">{q}</span>
        <span className={`text-neutral-600 text-lg shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-neutral-500 leading-relaxed -mt-1">{a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="py-16 px-5" id="faq">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">FAQ</h2>
        <p className="text-neutral-500 text-sm mb-8">Common questions, straight answers.</p>

        <div className="glass rounded-xl px-5">
          {faqs.map((f, i) => (
            <Item key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
