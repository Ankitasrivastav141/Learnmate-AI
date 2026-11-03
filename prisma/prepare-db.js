const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || dbUrl.startsWith('prisma+postgres://')) {
  console.log('[prepare-db] Detected PostgreSQL DATABASE_URL. Switching Prisma provider to postgresql...');
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  schema = schema.replace(/url\s*=\s*"file:[^"]*"/, 'url = env("DATABASE_URL")');
  fs.writeFileSync(schemaPath, schema, 'utf8');

  try {
    console.log('[prepare-db] Syncing schema to PostgreSQL with prisma db push...');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  } catch (err) {
    console.warn('[prepare-db] Note: prisma db push warning (continuing build):', err.message);
  }
} else {
  console.log('[prepare-db] Using SQLite datasource.');
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  if (!schema.includes('"file:./dev.db"')) {
    schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "file:./dev.db"');
  }
  fs.writeFileSync(schemaPath, schema, 'utf8');
}
