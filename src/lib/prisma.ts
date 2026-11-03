import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function getDatabaseUrl(): string {
  // If user provided a remote database (Postgres, Turso, Supabase, Neon) via env, use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL;
  }

  // On Vercel (or AWS Lambda), the runtime filesystem is read-only except /tmp.
  // We copy the bundled seed database to /tmp/dev.db where SQLite has full read/write permissions.
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidatePaths = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(__dirname, '..', '..', '..', 'prisma', 'dev.db'),
        path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
        path.resolve('prisma/dev.db'),
      ];

      let copied = false;
      for (const src of candidatePaths) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            copied = true;
            console.log(`Successfully copied SQLite DB from ${src} to ${tmpDbPath}`);
            break;
          } catch (err) {
            console.warn(`Failed copying from ${src}:`, err);
          }
        }
      }

      if (!copied) {
        console.warn('No source SQLite database found; creating empty database at /tmp/dev.db');
        fs.writeFileSync(tmpDbPath, '');
      }
    }
    return 'file:/tmp/dev.db';
  }

  // Local development: use absolute path to ensure Prisma finds dev.db without cwd ambiguity
  const localDb = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  return `file:${localDb}`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
