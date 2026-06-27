import { createApp } from '../src/api/app';
import { loadApiEnv } from '../src/config/env';

const env = loadApiEnv();
const app = createApp(env);

export default { fetch: (request: Request) => app.handle(request) };
