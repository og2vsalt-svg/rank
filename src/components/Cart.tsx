import { useState } from 'react';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { useRouter } from './Router';

const DISCORD = 'https://discord.gg/jfDBYWq6Ax';
const WEBHOOK = 'https://canary.discord.com/api/webhooks/1508879255868538991/E4V6PO2uQzgIvtApWfqKOjGbPK1j5OmI381KcGmHZsKXm8586gxW2Wu7oSGLkyfj5RED';

export default function Cart() {
  const { items, isOpen, setOpen, remove, updateQty, clear, total, count, maxEta, orderSummary } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { navigate } = useRouter();
  const [boostType, setBoostType] = useState<'duo' | 'account' | ''>('');
  const [payment, setPayment] = useState<'paypal' | 'crypto' | ''>('');
  const [cryptoCoin, setCryptoCoin] = useState<'BTC' | 'ETH' | 'LTC' | 'SOL' | ''>('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  // total hours rough estimate for warning
  const totalHours = items.reduce((s, x) => {
    const match = x.eta.match(/(\d+)/g);
    const nums = match ? match.map(Number) : [0];
    return s + nums[nums.length - 1] * x.qty;
  }, 0);

  const handleSubmitOrder = async () => {
    if (!isLoggedIn) {
      setOpen(false);
      navigate('login');
      return;
    }
    if (!boostType) {
      setSendError('Select a boost type (Duo or Account)');
      return;
    }
    if (!payment) {
      setSendError('Select a payment method');
      return;
    }
    if (payment === 'crypto' && !cryptoCoin) {
      setSendError('Select which crypto you want to pay with');
      return;
    }

    setSending(true);
    setSendError('');

    const itemLines = items.map(x =>
      `${x.qty > 1 ? x.qty + 'x ' : ''}**${x.label}** — $${(x.price * x.qty).toFixed(2)}${x.qty > 1 ? ` ($${x.price.toFixed(2)} each)` : ''}`
    );

    const embed = {
      title: '\uD83D\uDED2 New Boost Order',
      color: 0x4ade80,
      fields: [
        {
          name: '\uD83D\uDC64 Customer',
          value: `**${user!.username}**\n${user!.email}`,
          inline: true,
        },
        {
          name: '\uD83C\uDFAE Boost Type',
          value: boostType === 'duo' ? 'Duo (play together)' : 'Account (I play on their acc)',
          inline: true,
        },
        {
          name: '\uD83D\uDCB3 Payment',
          value: payment === 'paypal' ? 'PayPal' : `Crypto (${cryptoCoin})`,
          inline: true,
        },
        {
          name: '\uD83D\uDCE6 Items',
          value: itemLines.join('\n'),
          inline: false,
        },
        {
          name: '\uD83D\uDCB0 Total',
          value: `**$${total.toFixed(2)}**`,
          inline: true,
        },
        {
          name: '\u23F0 Est. Delivery',
          value: maxEta,
          inline: true,
        },
      ],
      footer: {
        text: `Order from ${user!.username} | User ID: ${user!.id}`,
      },
      timestamp: new Date().toISOString(),
    };

    if (notes.trim()) {
      embed.fields.push({
        name: '\uD83D\uDCDD Notes',
        value: notes.trim(),
        inline: false,
      });
    }

    try {
      const res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'rankboosts orders',
          avatar_url: '',
          content: '',
          embeds: [embed],
        }),
      });

      if (res.ok || res.status === 204) {
        setSent(true);
        setSending(false);
      } else {
        throw new Error('Webhook returned ' + res.status);
      }
    } catch {
      setSending(false);
      setSendError('Failed to send order. Try copying it and sending on Discord instead.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (sent) {
      clear();
      setSent(false);
      setBoostType('');
      setPayment('');
      setCryptoCoin('');
      setNotes('');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderSummary);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = orderSummary;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md glass-strong border-l-0 z-[70] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold">Your order</h2>
            {count > 0 && (
              <span className="text-[11px] font-semibold bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-white transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Sent success */}
        {sent ? (
          <div className="flex-1 flex items-center justify-center px-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Order sent!</h3>
              <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
                Your order has been sent to the booster. Join the Discord to confirm payment and get started.
              </p>
              <a
                href={DISCORD}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-green-500 text-black font-semibold text-sm hover:bg-green-400 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                Open Discord
              </a>
              <button
                onClick={handleClose}
                className="block mx-auto mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-neutral-700 mb-3">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <p className="text-neutral-500 text-sm">Your cart is empty</p>
                  <p className="text-neutral-600 text-xs mt-1">Add items from the pricing tabs</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="rounded-xl glass-subtle p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">{item.category}</span>
                            <p className="text-sm text-white font-medium leading-snug">{item.label}</p>
                          </div>
                          <button
                            onClick={() => remove(item.id)}
                            className="text-neutral-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQty(item.id, item.qty - 1)}
                              className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                            >
                              -
                            </button>
                            <span className="text-sm text-white font-medium w-5 text-center">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-white">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                        <div className="mt-2 text-[11px] text-neutral-600 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {item.eta}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery time warning */}
                  {totalHours > 12 && (
                    <div className={`mt-4 p-3 rounded-lg border text-xs leading-relaxed ${
                      totalHours > 48
                        ? 'border-red-500/20 bg-red-500/[0.05] text-red-400'
                        : totalHours > 24
                        ? 'border-yellow-500/20 bg-yellow-500/[0.05] text-yellow-400'
                        : 'border-neutral-700 bg-neutral-800/50 text-neutral-400'
                    }`}>
                      <div className="flex items-start gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <div>
                          {totalHours > 48 ? (
                            <span>
                              <strong>Heads up — this is a big order.</strong> Estimated total delivery time is {maxEta}.
                              Larger orders take significantly longer to complete.
                            </span>
                          ) : totalHours > 24 ? (
                            <span>
                              <strong>This order may take over a day.</strong> Estimated delivery: {maxEta}.
                            </span>
                          ) : (
                            <span>Estimated delivery: {maxEta}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order options */}
                  <div className="mt-5 space-y-4">
                    {/* Boost type */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-2">Boost type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setBoostType('duo'); setSendError(''); }}
                          className={`text-xs font-medium py-2.5 rounded-lg border transition-all ${
                            boostType === 'duo'
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-white/10 text-neutral-400 hover:border-white/20 hover:text-white bg-white/[0.03]'
                          }`}
                        >
                          Duo (play with me)
                        </button>
                        <button
                          onClick={() => { setBoostType('account'); setSendError(''); }}
                          className={`text-xs font-medium py-2.5 rounded-lg border transition-all ${
                            boostType === 'account'
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-white/10 text-neutral-400 hover:border-white/20 hover:text-white bg-white/[0.03]'
                          }`}
                        >
                          Account (I play for you)
                        </button>
                      </div>
                    </div>

                    {/* Payment */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-2">Payment method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setPayment('paypal'); setCryptoCoin(''); setSendError(''); }}
                          className={`text-xs font-medium py-2.5 rounded-lg border transition-all ${
                            payment === 'paypal'
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-white/10 text-neutral-400 hover:border-white/20 hover:text-white bg-white/[0.03]'
                          }`}
                        >
                          PayPal
                        </button>
                        <button
                          onClick={() => { setPayment('crypto'); setSendError(''); }}
                          className={`text-xs font-medium py-2.5 rounded-lg border transition-all ${
                            payment === 'crypto'
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-white/10 text-neutral-400 hover:border-white/20 hover:text-white bg-white/[0.03]'
                          }`}
                        >
                          Crypto
                        </button>
                      </div>

                      {/* Crypto coin picker */}
                      {payment === 'crypto' && (
                        <div className="mt-2">
                          <label className="block text-[11px] text-neutral-500 mb-1.5">Select coin</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['BTC', 'ETH', 'LTC', 'SOL'] as const).map(coin => (
                              <button
                                key={coin}
                                onClick={() => { setCryptoCoin(coin); setSendError(''); }}
                                className={`text-[11px] font-semibold py-2 rounded-lg border transition-all ${
                                  cryptoCoin === coin
                                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                                    : 'border-white/10 text-neutral-500 hover:border-white/20 hover:text-white bg-white/[0.03]'
                                }`}
                              >
                                {coin}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-2">Notes (optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Discord username, gamertag, specific requests..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/10 transition-colors resize-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-white/5 px-5 py-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-sm">Total</span>
                  <span className="text-white text-xl font-bold">${total.toFixed(2)}</span>
                </div>
                {maxEta && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Est. delivery</span>
                    <span className={`font-medium ${totalHours > 48 ? 'text-red-400' : totalHours > 24 ? 'text-yellow-400' : 'text-neutral-400'}`}>
                      {maxEta}
                    </span>
                  </div>
                )}

                {sendError && (
                  <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.05] text-red-400 text-xs">
                    {sendError}
                  </div>
                )}

                <button
                  onClick={handleSubmitOrder}
                  disabled={sending}
                  className="w-full py-2.5 rounded-lg bg-green-500 text-black font-semibold text-sm hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending order...' : !isLoggedIn ? 'Log in to order' : 'Submit order'}
                </button>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCopy}
                    className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Copy order text
                  </button>
                  <button
                    onClick={clear}
                    className="text-[11px] text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    Clear cart
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
