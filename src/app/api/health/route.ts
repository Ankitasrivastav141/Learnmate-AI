import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cwd = process.cwd();
  const tmpExists = fs.existsSync('/tmp/dev.db');
  const tmpSize = tmpExists ? fs.statSync('/tmp/dev.db').size : 0;

  const prismaDir = path.join(cwd, 'prisma');
  const prismaFiles = fs.existsSync(prismaDir) ? fs.readdirSync(prismaDir) : [];

  let dbSize = 0;
  const dbPath = path.join(prismaDir, 'dev.db');
  if (fs.existsSync(dbPath)) {
    dbSize = fs.statSync(dbPath).size;
  }

  return NextResponse.json({
    cwd,
    isVercel: !!process.env.VERCEL,
    databaseUrlEnv: process.env.DATABASE_URL || null,
    prismaFiles,
    dbPath,
    dbSize,
    tmpExists,
    tmpSize,
  });
}
