import { createApp } from '../src/api/app';
import { loadApiEnv } from '../src/config/env';

const env = loadApiEnv();
const app = createApp(env);

export const config = {
  runtime: 'nodejs20.x',  // bukan edge — biar Turso libsql compatible
};

export default async function handler(req: Request) {
  return app.handle(req);
}