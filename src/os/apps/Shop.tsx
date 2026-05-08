import { useState } from "react";
import { useOS } from "../store";
import { Coins, Sparkles, Shield, Palette, Image as ImageIcon, Type, Check, Lock } from "lucide-react";

interface Item {
  id: string;
  name: string;
  price: number;
  description: string;
  category: "theme" | "cosmetic" | "power";
  icon: any;
  badge?: string;
  repeatable?: boolean;
}

const ITEMS: Item[] = [
  { id: "theme_night", name: "Night Theme", price: 200, description: "Cool midnight aesthetic.", category: "theme", icon: Palette },
  { id: "theme_forest", name: "Forest Theme", price: 200, description: "Lush green vibes.", category: "theme", icon: Palette },
  { id: "theme_jason", name: "Jason Theme", price: 300, description: "The classic.", category: "theme", icon: Palette },
  { id: "theme_sebastian", name: "Sebastian Theme", price: 500, description: "Premium rosey energy.", category: "theme", icon: Palette, badge: "Premium" },
  { id: "theme_leo", name: "Leo Theme", price: 500, description: "Roar mode unlocked.", category: "theme", icon: Palette, badge: "Premium" },
  { id: "theme_jasoncat", name: "Jason Cat Theme", price: 1500, description: "Legendary feline form.", category: "theme", icon: Sparkles, badge: "LEGENDARY" },
  { id: "wallpaper_pack", name: "Wallpaper Pack", price: 800, description: "Unlock the ability to upload custom wallpapers.", category: "cosmetic", icon: ImageIcon },
  { id: "custom_font_slot", name: "Custom Font Slot", price: 400, description: "Cosmetic perk badge.", category: "cosmetic", icon: Type },
  { id: "admin_3_days", name: "Admin · 3 Days", price: 5000, description: "Become an admin for 3 days. Buying again extends time.", category: "power", icon: Shield, badge: "POWER", repeatable: true },
];

export function Shop() {
  const os = useOS();
  const me = os.state.users.find(u => u.id === os.state.currentUserId);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const points = me?.points ?? 0;
  const unlocks = me?.shopUnlocks ?? [];

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(null), 2500); }

  async function buy(item: Item) {
    if (busy) return;
    setBusy(item.id);
    try {
      await os.purchaseItem(item.id);
      flash(`✅ Bought ${item.name}`);
    } catch (e: any) {
      flash(`❌ ${e?.message || "Purchase failed"}`);
    } finally {
      setBusy(null);
    }
  }

  const cats: { key: Item["category"]; label: string }[] = [
    { key: "theme", label: "Themes" },
    { key: "cosmetic", label: "Cosmetics" },
    { key: "power", label: "Power-Ups" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-yellow-400" /> JASON Shop</h1>
          <p className="text-xs os-text-muted mt-0.5">Earn points by using the OS, then spend them on perks.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/20 border border-yellow-400/40">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-lg">{points.toLocaleString()}</span>
          <span className="text-xs os-text-muted">points</span>
        </div>
      </div>

      {msg && <div className="text-xs px-3 py-2 rounded-lg glass animate-fade-up">{msg}</div>}

      <section className="glass rounded-xl p-4 text-xs os-text-muted">
        <b className="os-text">How to earn:</b> open apps (+5), create a web app (+50), broadcast (+10), unlock secrets (+25), and more.
      </section>

      {cats.map(cat => (
        <section key={cat.key} className="space-y-2">
          <h2 className="font-semibold text-sm os-text-muted uppercase tracking-wider">{cat.label}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ITEMS.filter(i => i.category === cat.key).map(item => {
              const owned = unlocks.includes(item.id);
              const canBuy = points >= item.price && (!owned || item.repeatable);
              const Icon = item.icon;
              return (
                <div key={item.id} className="rounded-xl p-4 border space-y-2 flex flex-col"
                  style={{ background: "hsl(var(--os-glass))", borderColor: "hsl(var(--os-border))" }}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg grid place-items-center bg-gradient-to-br from-purple-500/40 to-blue-500/40">
                      <Icon className="w-5 h-5" />
                    </div>
                    {item.badge && <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-bold">{item.badge}</span>}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.name}</div>
                    <div className="text-[11px] os-text-muted">{item.description}</div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-1 text-sm font-bold"><Coins className="w-4 h-4 text-yellow-400" />{item.price.toLocaleString()}</div>
                    {owned && !item.repeatable ? (
                      <span className="text-[11px] px-3 py-1.5 rounded-lg bg-green-600 text-white flex items-center gap-1"><Check className="w-3 h-3" />Owned</span>
                    ) : (
                      <button disabled={!canBuy || busy === item.id} onClick={() => buy(item)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition os-accent-bg text-white flex items-center gap-1">
                        {!canBuy && points < item.price ? <><Lock className="w-3 h-3" />Need {item.price - points}</> : busy === item.id ? "..." : (item.repeatable && owned ? "Extend" : "Buy")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
