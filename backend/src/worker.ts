import { connectDatabase } from './config/database';
import './models'; // Initialize all models and associations

async function startWorker() {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('Database connected');

    // Import worker after DB is ready
    await import('./workers/email-sync.worker');

    console.log('Email sync worker started, waiting for jobs...');
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

startWorker();
