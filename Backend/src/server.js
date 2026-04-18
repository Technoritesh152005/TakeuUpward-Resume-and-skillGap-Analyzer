import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load Backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app.js';
import {connectDb} from './db/db.connect.js'
import logger from './utils/logs.js';
import mongoose from 'mongoose';
import { startAnalysisWorker } from './workers/analysis.worker.js';
import { startRoadmapWorker } from './workers/roadmap.worker.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`Error: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
let server;
let analysisWorker;
let roadmapWorker;

const startServer = async () => {
  await connectDb();
  analysisWorker = startAnalysisWorker();
  roadmapWorker = startRoadmapWorker();

  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`API documentation: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
  });
};

await startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(`Error: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  
  // Close server gracefully
  if (server) {
    server.close(() => {
      process.exit(1);
    });
    return;
  }

  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');

    analysisWorker?.close().catch((error) => {
      logger.error(`Failed to close analysis worker cleanly: ${error.message}`);
    });
    roadmapWorker?.close().catch((error) => {
      logger.error(`Failed to close roadmap worker cleanly: ${error.message}`);
    });
    
    // Close database connection
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
