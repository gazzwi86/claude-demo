import { z } from "zod";
import { ALLOWED_LOOP_MIMES, MAX_LOOP_BYTES, MAX_LOOP_DURATION_MS, PAD_GRID_SIZE } from "./constants.js";

export const EmailSchema = z.string().trim().toLowerCase().email().max(254);
export const PasswordSchema = z.string().min(8).max(200);
export const DisplayNameSchema = z.string().trim().min(1).max(60);

export const SignupSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  displayName: DisplayNameSchema,
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const PublicUserSchema = z.object({
  id: z.string(),
  email: EmailSchema,
  displayName: DisplayNameSchema,
  createdAt: z.string(),
});

export const LoopNameSchema = z.string().trim().min(1).max(80);

export const CreateLoopSchema = z.object({
  name: LoopNameSchema,
  durationMs: z.number().int().positive().max(MAX_LOOP_DURATION_MS),
  sampleRate: z.number().int().positive().max(192_000),
  bpm: z.number().positive().max(300).nullable().optional(),
  mimeType: z.enum(ALLOWED_LOOP_MIMES),
  sizeBytes: z.number().int().positive().max(MAX_LOOP_BYTES),
});

export const UpdateLoopSchema = z.object({
  name: LoopNameSchema.optional(),
  bpm: z.number().positive().max(300).nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const LoopMetaSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: LoopNameSchema,
  s3Key: z.string(),
  durationMs: z.number().int().positive(),
  sampleRate: z.number().int().positive(),
  bpm: z.number().nullable(),
  isPublic: z.boolean(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PadConfigSchema = z.object({
  loopId: z.string().nullable(),
  volume: z.number().min(0).max(1),
  mute: z.boolean(),
  solo: z.boolean(),
  playbackRate: z.number().min(0.25).max(4),
  filterCutoff: z.number().min(20).max(20_000),
});

export const SessionConfigSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().trim().min(1).max(80),
  pads: z.array(PadConfigSchema).length(PAD_GRID_SIZE),
  master: z.object({
    volume: z.number().min(0).max(1),
    delayMs: z.number().min(0).max(2000),
    delayFeedback: z.number().min(0).max(0.95),
    delayMix: z.number().min(0).max(1),
    reverbMix: z.number().min(0).max(1),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Signup = z.infer<typeof SignupSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type CreateLoop = z.infer<typeof CreateLoopSchema>;
export type UpdateLoop = z.infer<typeof UpdateLoopSchema>;
