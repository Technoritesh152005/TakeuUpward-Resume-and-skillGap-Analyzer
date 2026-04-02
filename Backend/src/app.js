import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import passport from './config/passport.js'
import googleAuthRoutes from './routes/googleAuthRoutes.js'



// ES6 module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import middleware
import {
  errorHandler,
  handler404,
  handleMongodbError,
  handleJwtError,
} from './middleware/errorHandler.js';

// Initialize Passport


// Import routes
import authRoutes from './routes/authRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js';
import jobRoleRoutes from './routes/jobRoleRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js'

// Import logger
import logger from './utils/logs.js';

// Create Express app
const app = express();
app.set('etag', false);


// Trust proxy (for rate limiting, IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet()); // Set security headers
app.use(mongoSanitize()); // Prevent MongoDB injection

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Custom morgan format for production (log to file via winston)
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}
app.use(passport.initialize());
// Serve static files (uploads folder)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
const API_VERSION = process.env.API_VERSION || 'v1';

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/resumes`, resumeRoutes);
app.use(`/api/${API_VERSION}/job-roles`, jobRoleRoutes);
app.use(`/api/${API_VERSION}/analysis`, analysisRoutes);
app.use(`/api/${API_VERSION}/roadmap`, roadmapRoutes);
app.use(`/api/${API_VERSION}/user`, userRoutes);
app.use(`/api/${API_VERSION}/auth`, googleAuthRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Resume Analyzer API',
    version: API_VERSION,
    endpoints: {
      health: '/health',
      auth: `/api/${API_VERSION}/auth`,
      resumes: `/api/${API_VERSION}/resumes`,
      jobRoles: `/api/${API_VERSION}/job-roles`,
      analysis: `/api/${API_VERSION}/analysis`,
      roadmap: `/api/${API_VERSION}/roadmap`,
      user: `/api/${API_VERSION}/user`,
    },
  });
});


// Error handling middleware (must be last)
app.use(handleMongodbError);
app.use(handleJwtError);
app.use(handler404); // 404 handler
app.use(errorHandler); // Global error handler

export default app;
