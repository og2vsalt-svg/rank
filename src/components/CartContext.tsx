import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  category: string;
  label: string;
  price: number;
  eta: string;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, 'qty'>) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
  maxEta: string;
  orderSummary: string;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}

function etaToHours(eta: string): number {
  const match = eta.match(/(\d+)/g);
  if (!match) return 0;
  const nums = match.map(Number);
  return nums[nums.length - 1];
}

function getMaxEta(items: CartItem[]): string {
  if (items.length === 0) return '';
  let maxH = 0;
  let maxLabel = '';
  for (const item of items) {
    const h = etaToHours(item.eta);
    if (h >= maxH) {
      maxH = h;
      maxLabel = item.eta;
    }
  }
  // sum up total hours for all items
  let totalH = 0;
  for (const item of items) {
    totalH += etaToHours(item.eta) * item.qty;
  }
  if (items.length === 1 && items[0].qty === 1) return maxLabel;
  if (totalH > 48) return `${Math.ceil(totalH / 24)}+ days (large order)`;
  if (totalH > 24) return '1-2 days';
  return maxLabel;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);

  const add = useCallback((item: Omit<CartItem, 'qty'>) => {
    setItems(prev => {
      const existing = prev.find(x => x.id === item.id);
      if (existing) {
        return prev.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(x => x.id !== id));
    } else {
      setItems(prev => prev.map(x => x.id === id ? { ...x, qty } : x));
    }
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, x) => s + x.price * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);
  const maxEta = getMaxEta(items);

  const orderSummary = items.length === 0 ? '' : [
    '--- ORDER SUMMARY ---',
    '',
    ...items.map(x =>
      `${x.qty > 1 ? x.qty + 'x ' : ''}${x.label} — $${(x.price * x.qty).toFixed(2)}${x.qty > 1 ? ` ($${x.price.toFixed(2)} each)` : ''}`
    ),
    '',
    `Total: $${total.toFixed(2)}`,
    `Est. delivery: ${maxEta}`,
    '',
    'Boost type preference: [Duo / Account]',
    'Payment method: [PayPal / Crypto]',
    '---------------------',
  ].join('\n');

  return (
    <CartContext.Provider value={{ items, isOpen, setOpen, add, remove, updateQty, clear, total, count, maxEta, orderSummary }}>
      {children}
    </CartContext.Provider>
  );
}
