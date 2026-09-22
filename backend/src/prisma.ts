import { PrismaClient } from '@prisma/client';

let prismaInstance: any;

function createSafeProxy(): any {
  const targetFn = () => Promise.reject(new Error('Prisma database is unavailable in this cloud environment'));
  return new Proxy(targetFn, {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined;
      }
      return createSafeProxy();
    },
    apply() {
      return Promise.reject(new Error('Prisma database is unavailable in this cloud environment'));
    },
  });
}

try {
  // If running on Vercel and no Postgres/external DATABASE_URL is configured, use safe proxy and rely on Supabase Cloud
  if (process.env.VERCEL && (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:'))) {
    console.warn('[Prisma] Vercel serverless environment detected without external DB: using Supabase Cloud');
    prismaInstance = createSafeProxy();
  } else {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
} catch (e: any) {
  console.warn('[Prisma] Initialization warning (falling back to cloud DB):', e?.message);
  prismaInstance = createSafeProxy();
}

export const prisma: PrismaClient = prismaInstance;
