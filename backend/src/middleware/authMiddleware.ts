import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication token missing or invalid.', 401);
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string; name: string };

    // 1. Trust hardcoded fallback users instantly
    if (decoded.id.startsWith('u-std-') || decoded.id === 'u1111111-1111-1111-1111-111111111111') {
      req.user = { id: decoded.id, email: decoded.email, name: decoded.name || 'User', role: decoded.role };
      return next();
    }

    // 2. Try Prisma
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
      if (user && user.isActive) {
        req.user = user;
        return next();
      }
      if (user && !user.isActive) {
        return sendError(res, 'Account has been deactivated.', 401);
      }
    } catch (prismaErr) {
      // Prisma might be disabled on Vercel, ignore and fallback
    }

    // 3. Try Supabase directly
    try {
      const { supabase } = await import('../config/supabase.js');
      const { data: suUser } = await supabase.from('User').select('id, email, name, role, isActive').eq('id', decoded.id).maybeSingle();
      if (suUser && suUser.isActive) {
        req.user = suUser as any;
        return next();
      }
      if (suUser && !suUser.isActive) {
        return sendError(res, 'Account has been deactivated.', 401);
      }
    } catch (suErr) {
      // Ignore
    }

    // 4. Serverless ultimate fallback: trust the JWT if DB is completely unreachable
    if (process.env.VERCEL) {
      req.user = { id: decoded.id, email: decoded.email, name: decoded.name || 'User', role: decoded.role };
      return next();
    }

    return sendError(res, 'Account not found or has been deactivated.', 401);
  } catch (err: any) {
    return sendError(res, 'Session expired or invalid token. Please log in again.', 401);
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return sendError(res, 'Access denied. Administrator privileges required.', 403);
  }
  next();
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'STUDENT') {
    return sendError(res, 'Access denied. Student privileges required.', 403);
  }
  next();
}
