import { useState } from "react";
import { useOS } from "../store";
import { jasonImg } from "../themes";

export function Boot() {
  const os = useOS();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem("jason-os-last-user") || ""; } catch { return ""; }
  });
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await (mode === "login" ? os.login(username, password) : os.signup(username, password));
    if (!res.ok) setErr(res.error || "Error");
    else { try { localStorage.setItem("jason-os-last-user", username); } catch {} }
  }

  return (
    <div className="fixed inset-0 wallpaper flex items-center justify-center" style={{ ["--wallpaper-url" as never]: "var(--boot-wp)" }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" />
      <div className="relative glass-strong rounded-2xl p-8 w-[360px] animate-fade-up shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-2 ring-white/40 shadow-2xl mb-3">
            <img src={jasonImg} alt="Jason" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-semibold os-text">Welcome to JASON OS</h1>
          <p className="text-xs os-text-muted mt-1">{mode === "login" ? "Sign in to continue" : "Create your account"}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full bg-white/20 border rounded-lg px-3 py-2 text-sm os-text placeholder:os-text-muted outline-none focus:ring-2"
            style={{ borderColor: "hsl(var(--os-border))" }}
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-white/20 border rounded-lg px-3 py-2 text-sm os-text placeholder:os-text-muted outline-none focus:ring-2"
            style={{ borderColor: "hsl(var(--os-border))" }}
          />
          {err && <div className="text-xs text-red-400">{err}</div>}
          <button type="submit" className="w-full os-accent-bg text-white py-2 rounded-lg font-medium text-sm hover:brightness-110">
            {mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); }}
          className="w-full text-xs os-text-muted mt-4 hover:underline"
        >
          {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
