import express from 'express';
import serverless from 'serverless-http';
import { apiRouter } from '../../server/api.ts';
import { Database } from '../../server/db.ts';

const app = express();

app.use(express.json());

// Initialize database
Database.init().catch((err) => {
  console.warn('Database initialization note in serverless function:', err.message);
});

// Mount on all prefixes for full Netlify redirect compatibility
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use('/', apiRouter);

export const handler = serverless(app);
