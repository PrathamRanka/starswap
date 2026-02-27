import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  logger.error(err.message, err.stack);

  let statusCode = err.status || err.statusCode || 500;
  let code = 'INTERNAL_ERROR';
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'INVALID_INPUT';
    message = err.errors[0]?.message || 'Validation failed';
  } else if (err.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    code = 'DATABASE_ERROR';
    message = 'Resource already exists';
  } else if (statusCode === 401) {
    code = 'UNAUTHENTICATED';
  } else if (statusCode === 429) {
    code = 'RATE_LIMITED';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
};

export default errorMiddleware;