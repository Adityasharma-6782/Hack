import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { teamLogin, teamLogout, teamState, openQuestion, takeHint, submitAnswer } from "@/lib/game.functions";
import { TeamQuestion } from "@/components/team-question";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operation ShadowTrace — Team Console" },
      { name: "description", content: "Log in with your team and solve 20 OSINT & ARG levels." },
      { property: "og:title", content: "Operation ShadowTrace" },
      { property: "og:description", content: "A 20-level OSINT & ARG investigation for college teams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type State = Awaited<ReturnType<typeof teamState>>;
const KEY = "shadowtrace_token";

function Index() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [kicked, setKicked] = useState(false);
  useEffect(() => { setToken(localStorage.getItem(KEY)); setReady(true); }, []);
  if (!ready) return null;
  if (!token) return <Login kicked={kicked} onIn={(t) => { localStorage.setItem(KEY, t); setKicked(false); setToken(t); }} />;
  return <Game token={token} onOut={(k) => { localStorage.removeItem(KEY); setKicked(k); setToken(null); }} />;
}

function Login({ onIn, kicked }: { onIn: (t: string) => void; kicked: boolean }) {
  const login = useServerFn(teamLogin);
  const [name, setName] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Classified // Case 0xST</p>
      <h1 className="glow mt-2 text-4xl font-bold text-primary">Operation ShadowTrace</h1>
      <p className="mt-3 text-sm text-muted-foreground">One device per team. Logging in here signs out any teammate already playing.</p>
      {kicked && <p className="mt-4 panel p-3 font-mono text-sm text-destructive">Session ended — another team member logged in.</p>}
      <form className="mt-8 space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        const r = await login({ data: { name, password: pw } }); setBusy(false);
        if ("token" in r && r.token) onIn(r.token); else setErr(r.error ?? "Failed");
      }}>
        <input className="w-full panel bg-background px-4 py-3 font-mono outline-none focus:border-primary" placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="password" className="w-full panel bg-background px-4 py-3 font-mono outline-none focus:border-primary" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="font-mono text-sm text-destructive">{err}</p>}
        <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-mono font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50">{busy ? "Connecting…" : "Enter"}</button>
      </form>
    </main>
  );
}

function Game({ token, onOut }: { token: string; onOut: (kicked: boolean) => void }) {
  const getState = useServerFn(teamState);
  const open = useServerFn(openQuestion);
  const hint = useServerFn(takeHint);
  const submit = useServerFn(submitAnswer);
  const logout = useServerFn(teamLogout);
  const [s, setS] = useState<State | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    const r = await getState({ data: { token } });
    if (r.loggedOut) onOut(true); else setS(r);
  }, [token]);
  useEffect(() => { refresh(); const i = setInterval(refresh, 4000); return () => clearInterval(i); }, [refresh]);

  if (!s || s.loggedOut) return <p className="p-10 font-mono text-muted-foreground">Decrypting…</p>;
  const solved = s.list.filter((x) => x.solved).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Agent team</p>
          <h1 className="glow text-2xl font-bold text-primary">{s.team.name}</h1>
        </div>
        <div className="flex items-center gap-4 font-mono text-sm">
          <span>{solved}/{s.list.length} solved</span>
          <span className="text-accent">{s.team.points} pts</span>
          <button className="rounded border border-border px-3 py-1 text-muted-foreground hover:text-foreground" onClick={async () => { await logout({ data: { token } }); onOut(false); }}>Logout</button>
        </div>
      </header>

      {s.active ? (
        <TeamQuestion key={s.active.id} question={s.active} message={msg} onHint={async () => {
          const active = s.active;
          if (!active || !confirm(`Use hint ${active.hintsUsed + 1}? Costs ${active.hintsUsed === 0 ? 5 : 10} points.`)) return;
          await hint({ data: { token } }); refresh();
        }} onSubmit={async (answer) => {
          const r = await submit({ data: { token, answer } });
          if ("correct" in r && r.correct) { setMsg(`Correct! +${r.points} pts`); refresh(); return true; }
          setMsg("Wrong flag. Try again."); return false;
        }} />
      ) : (
        <>
          {msg && <p className="mt-6 font-mono text-primary">{msg}</p>}
          <p className="mt-6 text-sm text-muted-foreground">Pick a case file. Once opened, you can't switch until you submit the correct flag.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {s.list.map((q) => (
              <button key={q.id} disabled={q.solved}
                onClick={async () => {
                  if (!confirm(`Open "${q.title}"? You'll be locked into it until solved.`)) return;
                  const r = await open({ data: { token, id: q.id } }); setMsg(""); 
                  if ("error" in r && r.error) setMsg(r.error); refresh();
                }}
                className="panel p-4 text-left transition hover:border-primary disabled:opacity-40">
                <div className="flex justify-between font-mono text-xs text-muted-foreground"><span>#{String(q.n).padStart(2, "0")}</span><span className="text-accent">{q.points}</span></div>
                <p className="mt-2 font-semibold">{q.title}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{q.type} · {q.tier}</p>
                {q.solved && <p className="mt-2 font-mono text-xs text-primary">✓ SOLVED</p>}
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
