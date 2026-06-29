import { z } from 'zod';

const baseSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().min(1),
});

const apiSchema = baseSchema.extend({
  CORS_ORIGIN: z.string().min(1),
  PORT: z.coerce.number().default(3000),
});

const jobSchema = baseSchema.extend({
  IG_SESSION_ID: z.string().min(1),
});

export type ApiEnv = z.infer<typeof apiSchema>;
export type JobEnv = z.infer<typeof jobSchema>;

export function loadApiEnv(): ApiEnv {
  const result = apiSchema.safeParse(process.env);
  if (!result.success) {
    // ✅ throw, bukan process.exit — biar error-nya keliatan di Vercel logs
    throw new Error(
      `[config] Missing env vars: ${JSON.stringify(result.error.flatten().fieldErrors)}`
    );
  }
  return result.data;
}

export function loadJobEnv(): JobEnv {
  const result = jobSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `[config] Missing env vars: ${JSON.stringify(result.error.flatten().fieldErrors)}`
    );
  }
  return result.data;
}
