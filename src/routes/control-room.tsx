import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminVerify,
  adminLeaderboard,
  adminCreateTeam,
  adminTeamAction,
  adminAnswers,
} from "@/lib/game.functions";
import { QuestionEditor } from "@/components/question-editor";

export const Route = createFileRoute("/control-room")({
  head: () => ({
    meta: [
      { title: "Control Room — ShadowTrace" },
      { name: "description", content: "Organizer-only console." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Control Room" },
      { property: "og:description", content: "Organizer-only console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Row = Awaited<ReturnType<typeof adminLeaderboard>>[number];

function Admin() {
  const verify = useServerFn(adminVerify);
  const board = useServerFn(adminLeaderboard);
  const create = useServerFn(adminCreateTeam);
  const act = useServerFn(adminTeamAction);
  const answers = useServerFn(adminAnswers);
  const [pw, setPw] = useState<string | null>(null);
  const [input, setInput] = useState(""); const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [keys, setKeys] = useState<Awaited<ReturnType<typeof adminAnswers>> | null>(null);
  const [tn, setTn] = useState(""); const [tp, setTp] = useState("");

  useEffect(() => { setPw(sessionStorage.getItem("st_admin")); }, []);
  const load = useCallback(async () => {
    if (!pw) return;
    try { setRows(await board({ data: { adminPassword: pw } })); }
    catch (error) {
      sessionStorage.removeItem("st_admin");
      setPw(null);
      const message = error instanceof Error ? error.message : "";
      setErr(
        message.includes("Wrong admin password")
          ? "Wrong password"
          : "Could not verify organizer access. Check the server terminal and .env settings, then restart the dev server.",
      );
    }
  }, [pw]);
  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);

  if (!pw) return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="glow text-3xl font-bold text-primary">Control Room</h1>
      <form className="mt-6 space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        setChecking(true);
        setErr("");
        try {
          const result = await verify({ data: { adminPassword: input } });
          if (!result.valid) {
            setErr("Wrong password");
            return;
          }
          sessionStorage.setItem("st_admin", input);
          setPw(input);
        } catch {
          setErr("Could not verify organizer access. Check the server terminal and .env settings, then restart the dev server.");
        } finally {
          setChecking(false);
        }
      }}>
        <input type="password" className="w-full panel bg-background px-4 py-3 font-mono" placeholder="Organizer password" value={input} onChange={(e) => setInput(e.target.value)} />
        {err && <p className="font-mono text-sm text-destructive">{err}</p>}
        <button disabled={checking} className="w-full rounded-md bg-primary py-3 font-mono font-bold text-primary-foreground disabled:opacity-50">{checking ? "Checking…" : "Unlock"}</button>
      </form>
    </main>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="glow text-3xl font-bold text-primary">Leaderboard</h1>
        <button className="font-mono text-sm text-muted-foreground" onClick={() => { sessionStorage.removeItem("st_admin"); setPw(null); }}>Lock</button>
      </div>

      <form className="mt-6 flex flex-wrap gap-2 panel p-4" onSubmit={async (e) => {
        e.preventDefault();
        const r = await create({ data: { adminPassword: pw, name: tn, password: tp } });
        if ("error" in r && r.error) alert(r.error); else { setTn(""); setTp(""); load(); }
      }}>
        <input className="flex-1 panel bg-background px-3 py-2 font-mono" placeholder="New team name" value={tn} onChange={(e) => setTn(e.target.value)} />
        <input className="flex-1 panel bg-background px-3 py-2 font-mono" placeholder="Team password (4+)" value={tp} onChange={(e) => setTp(e.target.value)} />
        <button className="rounded-md bg-primary px-4 font-mono font-bold text-primary-foreground">Add team</button>
      </form>

      <div className="mt-6 overflow-x-auto panel">
        <table className="w-full font-mono text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="p-3">#</th><th>Team</th><th>Points</th><th>Solved</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 text-accent">{i + 1}</td>
                <td className="font-semibold">{r.name}</td>
                <td className="text-primary">{r.points}</td>
                <td>{r.solved}/20</td>
                <td className="text-xs">{r.online ? "● online" : "○ offline"}{r.active ? ` · on ${r.active}` : ""}</td>
                <td className="space-x-2 whitespace-nowrap p-2 text-xs">
                  <button className="underline" onClick={async () => { await act({ data: { adminPassword: pw, id: r.id, action: "kick" } }); load(); }}>Kick</button>
                  <button className="underline" onClick={async () => { await act({ data: { adminPassword: pw, id: r.id, action: "unlock" } }); load(); }}>Unlock Q</button>
                  <button className="text-destructive underline" onClick={async () => { if (confirm(`Delete ${r.name}?`)) { await act({ data: { adminPassword: pw, id: r.id, action: "delete" } }); load(); } }}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No teams yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <QuestionEditor password={pw} onSaved={() => setKeys(null)} />

      <button className="mt-8 font-mono text-sm text-accent underline" onClick={async () => setKeys(keys ? null : await answers({ data: { adminPassword: pw } }))}>{keys ? "Hide" : "Show"} answer key & setup</button>
      {keys && <div className="mt-3 space-y-2">{keys.map((k) => (
        <div key={k.level} className="panel p-3 text-sm"><b>L{k.level} {k.title}</b> — <span className="font-mono text-primary">{k.answer}</span><p className="text-muted-foreground">{k.setup}</p></div>
      ))}</div>}
    </main>
  );
}
