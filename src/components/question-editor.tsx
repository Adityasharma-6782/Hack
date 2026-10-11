import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Save, Pencil, X, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminQuestions, adminSaveQuestion } from "@/lib/game.functions";
import { questionSchema, type EditableQuestion } from "@/lib/question-schema";
import { TeamQuestion } from "@/components/team-question";

export function QuestionEditor({ password, onSaved }: { password: string; onSaved: () => void }) {
  const getQuestions = useServerFn(adminQuestions);
  const saveQuestion = useServerFn(adminSaveQuestion);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [draft, setDraft] = useState<EditableQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<EditableQuestion | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const showPreview = (question: EditableQuestion) => {
    setPreview(question);
    setHintsUsed(0);
  };
  useEffect(() => {
    let cancelled = false;
    getQuestions({ data: { adminPassword: password } })
      .then((q) => {
        if (!cancelled) setQuestions(q);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load questions.");
      });
    return () => {
      cancelled = true;
    };
  }, [password]);

  const field = (
    key: "title" | "type" | "story" | "task" | "tools" | "answer" | "solution" | "setup",
    label: string,
    multiline = false,
  ) => {
    if (!draft) return null;
    const props = {
      id: `question-${key}`,
      value: draft[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft({ ...draft, [key]: e.target.value }),
      className: "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground",
      required: ["title", "type", "task", "answer"].includes(key),
    };
    return (
      <div className={multiline ? "sm:col-span-2" : ""}>
        <label htmlFor={props.id} className="mb-1 block text-sm text-muted-foreground">
          {label}
        </label>
        {multiline ? <textarea {...props} rows={3} /> : <input {...props} />}
      </div>
    );
  };

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-2xl font-bold text-primary">Questions</h2>
      {error && (
        <p role="alert" className="mt-3 text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-accent">
          {notice}
        </p>
      )}
      {preview ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Team preview · {preview.id}</h3>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setHintsUsed(0)}>
                <RotateCcw />
                Reset hints
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreview(null)}>
                <X />
                {draft ? "Back to editing" : "Close preview"}
              </Button>
            </div>
          </div>
          <TeamQuestion
            key={preview.id}
            preview
            question={{
              title: preview.title,
              type: preview.type,
              tier: preview.tier,
              points: preview.points,
              story: preview.story,
              task: preview.task,
              tools: preview.tools,
              hints: preview.hints.slice(0, hintsUsed),
              hintsUsed,
            }}
            onHint={() => setHintsUsed((used) => Math.min(2, used + 1))}
          />
        </div>
      ) : draft ? (
        <form
          className="mt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setNotice("");
            const result = questionSchema.safeParse(draft);
            if (!result.success) {
              setError(result.error.issues[0]?.message ?? "Check the question fields.");
              return;
            }
            setBusy(true);
            try {
              await saveQuestion({ data: { adminPassword: password, question: result.data } });
              setQuestions((q) =>
                q.map((item) => (item.id === result.data.id ? result.data : item)),
              );
              setDraft(null);
              setNotice(`${result.data.id} saved.`);
              onSaved();
            } catch {
              setError("Could not save question. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit {draft.id}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cancel editing"
              title="Cancel editing"
              disabled={busy}
              onClick={() => {
                if (confirm("Discard unsaved changes?")) {
                  setDraft(null);
                  setError("");
                }
              }}
            >
              <X />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("title", "Title")}
            {field("type", "Category")}
            <div>
              <label htmlFor="question-tier" className="mb-1 block text-sm text-muted-foreground">
                Difficulty
              </label>
              <select
                id="question-tier"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                value={draft.tier}
                onChange={(e) => {
                  const tier = questionSchema.innerType().shape.tier.parse(e.target.value);
                  setDraft({ ...draft, tier });
                }}
              >
                {["Easy", "Medium", "Hard", "Boss"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="question-points" className="mb-1 block text-sm text-muted-foreground">
                Points
              </label>
              <input
                id="question-points"
                type="number"
                min={0}
                max={100000}
                step={1}
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                value={draft.points}
                onChange={(e) => setDraft({ ...draft, points: e.target.valueAsNumber })}
              />
            </div>
            {field("story", "Story", true)}
            {field("task", "Question", true)}
            {field("tools", "Tools")}
            {field("answer", "Correct answer")}
            {draft.hints.map((hint, i) => (
              <div key={i}>
                <label htmlFor={`hint-${i}`} className="mb-1 block text-sm text-muted-foreground">
                  Hint {i + 1} (−{i === 0 ? 5 : 10} points)
                </label>
                <textarea
                  id={`hint-${i}`}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                  rows={2}
                  value={hint}
                  onChange={(e) => {
                    const hints: [string, string] = [...draft.hints];
                    hints[i] = e.target.value;
                    setDraft({ ...draft, hints });
                  }}
                />
              </div>
            ))}
            {field("solution", "Private solution notes", true)}
            {field("setup", "Private setup notes", true)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              <Save />
              {busy ? "Saving…" : "Save question"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => showPreview(draft)}
            >
              <Eye />
              Preview
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {!questions.length && !error && (
            <p className="py-4 text-muted-foreground">Loading questions…</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">
                  {q.id} · {q.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {q.tier} · {q.points} points
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => showPreview(q)}>
                  <Eye />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraft({ ...q, hints: [...q.hints] });
                    setNotice("");
                    setError("");
                  }}
                >
                  <Pencil />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
