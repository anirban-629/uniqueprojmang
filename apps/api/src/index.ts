import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.config.js';

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`\n⚡ Flowline Modular Backend running at: http://localhost:${env.PORT}`);
    console.log(`📖 Interactive Swagger UI at:          http://localhost:${env.PORT}/docs\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
