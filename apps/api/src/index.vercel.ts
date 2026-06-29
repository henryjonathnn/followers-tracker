import { createApp } from './api/app';
import { loadApiEnv } from './config/env';

// Jangan app.listen() — export fetch handler aja
const env = loadApiEnv();
const app = createApp(env);

export default app; // Elysia implements Web Fetch API, langsung works