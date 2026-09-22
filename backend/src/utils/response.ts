import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res: Response, message = 'An error occurred', statusCode = 400, errors: any = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
