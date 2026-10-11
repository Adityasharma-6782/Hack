import { describe, expect, it } from "vitest";
import { questionSchema } from "./question-schema";

const question = { id: "L1", level: 1, title: "Custom question", type: "Quiz", tier: "Easy", points: 100, story: "", task: "What is the answer?", tools: "", hints: ["First", "Second"], answer: "MY_ANSWER", solution: "Private", setup: "Private" };

describe("custom question validation", () => {
  it("preserves the organizer's custom answer", () => {
    expect(questionSchema.parse(question).answer).toBe("MY_ANSWER");
  });
  it("preserves the organizer's custom points", () => {
    expect(questionSchema.parse({ ...question, points: 275 }).points).toBe(275);
  });
  it("rejects changed question identity to preserve team progress", () => {
    expect(questionSchema.safeParse({ ...question, id: "L2" }).success).toBe(false);
  });
});