import { Trophy, Lock, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useOS } from "../store";

const ACHIEVEMENTS: { id: string; name: string; hint: string; reward: number }[] = [
  { id: "konami",             name: "Konami Master",       hint: "An ancient cheat code from another era…",                        reward: 100 },
  { id: "rosebud",            name: "Rosebud",             hint: "Type the word a sled is named after.",                          reward: 100 },
  { id: "leothelegend",       name: "Leo the Legend",      hint: "Spell out the legend's title.",                                 reward: 100 },
  { id: "jasonking",          name: "Long Live the King",  hint: "Hail the OS by its true title.",                                reward: 150 },
  { id: "four_corners",       name: "Four Corners",        hint: "Touch all four corners of the screen many times.",              reward: 100 },
  { id: "midnight_owl",       name: "Midnight Owl",        hint: "Be online when the day flips over.",                            reward: 250 },
  { id: "speed_clicker",      name: "Speed Clicker",       hint: "Click extremely fast — like 30 times in 5 seconds fast.",       reward: 75 },
  { id: "logo_triple_click",  name: "Logo Whisperer",      hint: "Triple-click the JASON OS title.",                              reward: 50 },
  { id: "ghost_idle",         name: "Ghost",               hint: "Disappear. Don't touch a thing for a whole minute.",            reward: 75 },
  { id: "whisper_iceman",     name: "I AM ICEMAN",         hint: "Whisper the cold one's name.",                                  reward: 50 },
  { id: "shop_curious",       name: "Window Shopper",      hint: "Browse the JASON Shop.",                                       reward: 25 },
  { id: "jumpscare_survivor", name: "Jumpscare Survivor",  hint: "Survive 3 jumpscares without quitting.",                       reward: 150 },
  { id: "app_collector",      name: "App Collector",       hint: "Open lots of different apps in one session.",                  reward: 200 },
];

export function Achievements() {
  const os = useOS();
  const me = os.state.users.find(u => u.id === os.state.currentUserId);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const discovered = new Set(me?.achievementsDiscovered || []);
  const claimed = new Set(me?.achievementsClaimed || []);

  async function claim(id: string) {
    setBusy(id);
    try {
      const r: any = await os.claimAchievement(id);
      setMsg(`+${r?.reward ?? 0} pts!`);
      setTimeout(() => setMsg(null), 2500);
    } catch (e: any) {
      setMsg(`❌ ${e?.message || e}`);
      setTimeout(() => setMsg(null), 3000);
    } finally { setBusy(null); }
  }

  const totalDone = ACHIEVEMENTS.filter(a => claimed.has(a.id)).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-500" /> Achievements</h1>
        <div className="text-sm os-text-muted">{totalDone} / {ACHIEVEMENTS.length} claimed · <b className="os-text">{me?.points || 0}</b> pts</div>
      </div>
      {msg && <div className="text-xs px-3 py-1.5 rounded-full bg-green-500/80 text-white inline-block animate-fade-up">{msg}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map(a => {
          const isDiscovered = discovered.has(a.id);
          const isClaimed = claimed.has(a.id);
          return (
            <div key={a.id} className={`rounded-xl p-4 border ${isClaimed ? "opacity-70" : ""}`} style={{ background: "hsl(var(--os-glass))", borderColor: "hsl(var(--os-border))" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isClaimed ? <Check className="w-4 h-4 text-green-500" /> : isDiscovered ? <Sparkles className="w-4 h-4 text-yellow-400" /> : <Lock className="w-4 h-4 os-text-muted" />}
                    <span className="truncate">{isDiscovered || isClaimed ? a.name : "???"}</span>
                  </div>
                  <div className="text-xs os-text-muted mt-1">{a.hint}</div>
                  <div className="text-[11px] mt-2 font-medium text-yellow-500">+{a.reward} pts</div>
                </div>
              </div>
              <button
                disabled={!isDiscovered || isClaimed || busy === a.id}
                onClick={() => claim(a.id)}
                className={`mt-3 w-full text-xs py-1.5 rounded-lg font-medium transition ${isClaimed ? "bg-white/10 os-text-muted cursor-default" : isDiscovered ? "os-accent-bg text-white hover:opacity-90" : "bg-white/5 os-text-muted cursor-not-allowed"}`}
              >
                {isClaimed ? "Claimed" : isDiscovered ? (busy === a.id ? "Claiming…" : "Claim Reward") : "Locked — find it first"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] os-text-muted">Tip: Easter eggs are hidden throughout JASON OS. Try strange clicks, weird typing, or unusual times of day.</div>
    </div>
  );
}
