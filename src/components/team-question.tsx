import { useState } from "react";
import { Button } from "@/components/ui/button";

export type TeamQuestionData = {
  title: string; type: string; tier: string; points: number;
  story: string; task: string; tools: string; hints: string[]; hintsUsed: number;
};

export function TeamQuestion({ question: q, onHint, onSubmit, message = "", preview = false }: {
  question: TeamQuestionData;
  onHint: () => void;
  onSubmit?: (answer: string) => Promise<boolean>;
  message?: string;
  preview?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  return <section className="mt-6 panel p-6" aria-label="Team question">
    <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase">
      <span className="rounded bg-secondary px-2 py-1">{q.type}</span>
      <span className="rounded bg-secondary px-2 py-1 text-primary">{q.tier} · {q.points} pts</span>
      <span className="text-destructive">Locked until solved</span>
    </div>
    <h2 className="mt-3 break-words text-3xl font-bold">{q.title}</h2>
    <p className="mt-3 whitespace-pre-wrap break-words italic text-muted-foreground">“{q.story}”</p>
    <p className="mt-5 whitespace-pre-wrap break-words leading-relaxed">{q.task}</p>
    <p className="mt-4 break-words font-mono text-sm text-muted-foreground">Tools: {q.tools}</p>
    {q.hints.map((h, i) => <p key={i} className="mt-3 whitespace-pre-wrap break-words rounded border border-primary/40 p-3 text-sm text-primary">Hint {i + 1}: {h}</p>)}
    {q.hintsUsed < 2 && <Button type="button" variant="link" className="mt-4 h-auto px-0 font-mono text-sm" onClick={onHint}>Reveal hint {q.hintsUsed + 1} (−{q.hintsUsed === 0 ? 5 : 10} pts)</Button>}
    <form className="mt-6 flex flex-wrap gap-2" onSubmit={async (e) => {
      e.preventDefault();
      if (preview || !answer.trim() || !onSubmit) return;
      if (await onSubmit(answer)) setAnswer("");
    }}>
      <input aria-label="Answer" className="min-w-0 flex-1 panel bg-background px-4 py-3 font-mono outline-none focus:border-primary" placeholder="SHADOW{...}" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <Button type="submit" disabled={preview} className="h-auto px-6 py-3 font-mono font-bold">Submit</Button>
    </form>
    {message && <p className="mt-3 font-mono text-sm">{message}</p>}
  </section>;
}