import { createApp } from './api/app';
import { loadApiEnv } from './config/env';

const env = loadApiEnv();
const app = createApp(env);

app.listen(env.PORT, () => console.log(`[api] http://localhost:${env.PORT}`));
