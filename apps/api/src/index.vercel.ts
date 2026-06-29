import { createApp } from './api/app';
import { loadApiEnv } from './config/env';

const env = loadApiEnv();
const app = createApp(env);

// Edge runtime butuh export fetch handler langsung
export default app.fetch;