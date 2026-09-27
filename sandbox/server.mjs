import { createServer } from 'node:http';
import handler from './api/index.mjs';

// Loopback only locally. Vercel deploys api/index.mjs, not this local runner.
createServer(handler).listen(Number(process.env.PORT || 4173), '127.0.0.1', () => {
  console.log('Sandbox ready at http://127.0.0.1:' + (process.env.PORT || 4173));
});
