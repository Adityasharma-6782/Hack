import { z } from "zod";

export const questionSchema = z.object({
  id: z.string().regex(/^L([1-9]|1[0-9]|20)$/),
  level: z.number().int().min(1).max(20),
  title: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(100),
  tier: z.enum(["Easy", "Medium", "Hard", "Boss"]),
  points: z.number().int().min(0).max(100000),
  story: z.string().max(10000),
  task: z.string().trim().min(1).max(20000),
  tools: z.string().max(2000),
  hints: z.tuple([z.string().max(5000), z.string().max(5000)]),
  answer: z.string().trim().min(1).max(200),
  solution: z.string().max(10000),
  setup: z.string().max(10000),
}).refine((q) => q.id === `L${q.level}`, { message: "Question identity cannot change" });

export type EditableQuestion = z.infer<typeof questionSchema>;