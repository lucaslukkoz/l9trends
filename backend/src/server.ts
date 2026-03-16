import app from './app';
import { env } from './config/env';
import sequelize, { connectDatabase } from './config/database';
import { ensureKeys } from './auth/jwtService';
import './models';

async function start() {
  ensureKeys();
  await connectDatabase();

  const syncOptions = env.NODE_ENV === 'development' ? { alter: true } : {};
  await sequelize.sync(syncOptions);
  console.log('Database synced.');

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
