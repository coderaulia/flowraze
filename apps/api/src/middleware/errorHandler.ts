import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function sanitizeError(err: Error): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    name: err.name,
    message: err.message,
  };

  if (err instanceof AppError) {
    entry.statusCode = err.statusCode;
    entry.code = err.code;
  }

  if ('code' in err) {
    entry.prismaCode = (err as { code?: string }).code;
  }

  // Include stack in development only
  if (process.env.NODE_ENV !== 'production') {
    entry.stack = err.stack;
  }

  return entry;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[error]', JSON.stringify(sanitizeError(err)));

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if ('code' in err && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A matching record already exists',
      code: 'DUPLICATE_RECORD',
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
