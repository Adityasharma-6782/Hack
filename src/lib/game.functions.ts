import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { questionSchema } from "./question-schema";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("shadowtrace:" + s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function checkAdmin(pw: string) {
  const real = process.env["ADMIN_PASSWORD"];
  if (!real || pw !== real) throw new Error("Wrong admin password");
}
const HINT_COST = [5, 10];

async function teamByToken(token: string) {
  const s = await db();
  const { data } = await s.from("teams").select("*").eq("session_token", token).maybeSingle();
  return data;
}

export const teamLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().min(1).max(60), password: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { data: t } = await s.from("teams").select("id,password_hash").ilike("name", data.name.trim()).maybeSingle();
    if (!t || t.password_hash !== (await sha(data.password))) return { error: "Invalid team name or password" };
    const token = crypto.randomUUID() + crypto.randomUUID();
    // New login replaces the old session: any other device is logged out.
    await s.from("teams").update({ session_token: token }).eq("id", t.id);
    return { token };
  });

export const teamLogout = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    await s.from("teams").update({ session_token: null }).eq("session_token", data.token);
    return { ok: true };
  });

export const teamState = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const t = await teamByToken(data.token);
    if (!t) return { loggedOut: true as const };
    const { loadQuestions } = await import("./questions.server");
    const QUESTIONS = await loadQuestions();
    const byId = (id: string) => QUESTIONS.find((q) => q.id === id);
    const s = await db();
    const { data: solves } = await s.from("solves").select("question_id").eq("team_id", t.id);
    const solved = new Set((solves ?? []).map((x) => x.question_id));
    const order = t.question_order.length ? t.question_order : QUESTIONS.map((x) => x.id);
    const hints = (t.hints_used ?? {}) as Record<string, number>;
    const list = order.flatMap((id, i) => {
      const qq = byId(id);
      if (!qq) return [];
      return { id, n: i + 1, title: qq.title, type: qq.type, tier: qq.tier, points: qq.points, solved: solved.has(id) };
    });
    const a = t.active_question_id ? byId(t.active_question_id) : null;
    const used = a ? hints[a.id] ?? 0 : 0;
    return {
      loggedOut: false as const,
      team: { name: t.name, points: t.points },
      list,
      active: a
        ? { id: a.id, title: a.title, type: a.type, tier: a.tier, points: a.points, story: a.story, task: a.task, tools: a.tools,
            hints: a.hints.slice(0, used), hintsUsed: used }
        : null,
    };
  });

export const openQuestion = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const t = await teamByToken(data.token);
    if (!t) return { error: "Logged out" };
    if (t.active_question_id && t.active_question_id !== data.id)
      return { error: "Solve your open question first" };
    const s = await db();
    const { data: done } = await s.from("solves").select("id").eq("team_id", t.id).eq("question_id", data.id).maybeSingle();
    if (done) return { error: "Already solved" };
    if (!t.question_order.includes(data.id)) return { error: "Unknown question" };
    await s.from("teams").update({ active_question_id: data.id }).eq("id", t.id);
    return { ok: true };
  });

export const takeHint = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const t = await teamByToken(data.token);
    if (!t?.active_question_id) return { error: "No open question" };
    const hints = { ...((t.hints_used ?? {}) as Record<string, number>) };
    const used = hints[t.active_question_id] ?? 0;
    if (used >= 2) return { error: "No more hints" };
    hints[t.active_question_id] = used + 1;
    const s = await db();
    await s.from("teams").update({ hints_used: hints }).eq("id", t.id);
    return { ok: true };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), answer: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    const t = await teamByToken(data.token);
    if (!t?.active_question_id) return { error: "No open question" };
    const { loadQuestions, normalize } = await import("./questions.server");
    const qq = (await loadQuestions()).find((q) => q.id === t.active_question_id);
    if (!qq) return { error: "Unknown question" };
    if (normalize(data.answer) !== normalize(qq.answer)) return { correct: false };
    const used = ((t.hints_used ?? {}) as Record<string, number>)[qq.id] ?? 0;
    const penalty = HINT_COST.slice(0, used).reduce((a, b) => a + b, 0);
    const pts = Math.max(0, qq.points - penalty);
    const s = await db();
    const { error } = await s.from("solves").insert({ team_id: t.id, question_id: qq.id, points: pts });
    if (!error) {
      await s.from("teams").update({ points: t.points + pts, active_question_id: null, last_solve_at: new Date().toISOString() }).eq("id", t.id);
    }
    return { correct: true, points: pts };
  });

// ---------- Admin ----------
const adminIn = z.object({ adminPassword: z.string() });

export const adminVerify = createServerFn({ method: "POST" })
  .inputValidator((d) => adminIn.parse(d))
  .handler(async ({ data }) => {
    const real = process.env["ADMIN_PASSWORD"];
    return { valid: !!real && data.adminPassword === real };
  });

export const adminLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((d) => adminIn.parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.adminPassword);
    const s = await db();
    const { data: teams } = await s.from("teams").select("id,name,points,active_question_id,session_token,last_solve_at").order("points", { ascending: false }).order("last_solve_at", { ascending: true, nullsFirst: false });
    const { data: solves } = await s.from("solves").select("team_id");
    const count: Record<string, number> = {};
    (solves ?? []).forEach((x) => (count[x.team_id] = (count[x.team_id] ?? 0) + 1));
    return (teams ?? []).map((t) => ({ id: t.id, name: t.name, points: t.points, solved: count[t.id] ?? 0, online: !!t.session_token, active: t.active_question_id, lastSolve: t.last_solve_at }));
  });

export const adminCreateTeam = createServerFn({ method: "POST" })
  .inputValidator((d) => adminIn.extend({ name: z.string().trim().min(1).max(60), password: z.string().min(4).max(100) }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.adminPassword);
    const { loadQuestions } = await import("./questions.server");
    const order = (await loadQuestions()).map((x) => x.id);
    for (let i = order.length - 1; i > 0; i--) {
      const random = crypto.getRandomValues(new Uint32Array(1))[0];
      if (random === undefined) continue;
      const j = random % (i + 1);
      const tmp = order[i]; const other = order[j];
      if (tmp === undefined || other === undefined) continue;
      order[i] = other; order[j] = tmp;
    }
    const s = await db();
    const { error } = await s.from("teams").insert({ name: data.name, password_hash: await sha(data.password), question_order: order });
    if (error) return { error: error.code === "23505" ? "Team name already exists" : "Could not create team" };
    return { ok: true };
  });

export const adminTeamAction = createServerFn({ method: "POST" })
  .inputValidator((d) => adminIn.extend({ id: z.string().uuid(), action: z.enum(["kick", "unlock", "delete"]) }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.adminPassword);
    const s = await db();
    if (data.action === "delete") await s.from("teams").delete().eq("id", data.id);
    if (data.action === "kick") await s.from("teams").update({ session_token: null }).eq("id", data.id);
    if (data.action === "unlock") await s.from("teams").update({ active_question_id: null }).eq("id", data.id);
    return { ok: true };
  });

export const adminAnswers = createServerFn({ method: "POST" })
  .inputValidator((d) => adminIn.parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.adminPassword);
    const { loadQuestions } = await import("./questions.server");
    const QUESTIONS = await loadQuestions();
    return QUESTIONS.map((x) => ({ level: x.level, title: x.title, answer: x.answer, setup: x.setup }));
  });

export const adminQuestions = createServerFn({ method: "POST" })
  .inputValidator((d) => adminIn.parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.adminPassword);
    const { loadQuestions } = await import("./questions.server");
    return loadQuestions();
  });

export const adminSaveQuestion = createServerFn({ method: "POST" })
  .inputValidator((d) => adminIn.extend({ question: questionSchema }).parse(d))
  .handler(async ({ data }) => {
    checkAdmin(data.adminPassword);
    const s = await db();
    const { error } = await s.from("question_overrides").upsert({
      id: data.question.id, content: data.question, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Could not save question");
    return { ok: true };
  });
