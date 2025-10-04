import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Log request
  console.log({
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    console.log({
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};