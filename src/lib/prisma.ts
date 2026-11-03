import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function setupVercelDatabase(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL;
  }

  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.resolve('prisma/dev.db'),
        path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
      ];

      for (const src of candidates) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            break;
          } catch (e) {
            console.error('Error copying db:', e);
          }
        }
      }
    }
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
    return 'file:/tmp/dev.db';
  }

  if (!process.env.DATABASE_URL) {
    const localDb = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
    process.env.DATABASE_URL = `file:${localDb}`;
  }
  return process.env.DATABASE_URL;
}

const dbUrl = setupVercelDatabase();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
