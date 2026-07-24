const fs = require('fs');
const path = require('path');

const mode = process.argv[2];

if (!['local', 'remote'].includes(mode)) {
  console.error('Mode harus "local" (SQLite) atau "remote" (PostgreSQL)');
  process.exit(1);
}

console.log(`🔄 Switching database mode to: ${mode.toUpperCase()}...`);

const root = __dirname;
const schemaPath = path.join(root, 'src/db/schema/index.ts');
const envPath = path.join(root, '.env');
const drizzleConfigPath = path.join(root, 'drizzle.config.ts');

// 1. Swap Schema
const sqliteSchema = fs.readFileSync(path.join(root, 'src/db/schema/sqlite.ts'), 'utf8');
const pgSchema = fs.readFileSync(path.join(root, 'src/db/schema/pg.ts'), 'utf8');

if (mode === 'local') {
  fs.writeFileSync(schemaPath, sqliteSchema);
} else {
  fs.writeFileSync(schemaPath, pgSchema);
}
console.log(`✅ Schema diupdate ke ${mode === 'local' ? 'SQLite' : 'PostgreSQL'}`);

// 2. Swap .env
if (fs.existsSync(envPath)) {
  let env = fs.readFileSync(envPath, 'utf8');
  if (mode === 'local') {
    env = env.replace(/^DATABASE_URL=postgresql:/gm, '# DATABASE_URL=postgresql:');
    if (!env.includes('DATABASE_URL=file:data/absensi.db')) {
      env += '\nDATABASE_URL=file:data/absensi.db\n';
    } else {
      env = env.replace(/^#\s*DATABASE_URL=file:data/gm, 'DATABASE_URL=file:data');
    }
  } else {
    env = env.replace(/^#\s*DATABASE_URL=postgresql:/gm, 'DATABASE_URL=postgresql:');
    env = env.replace(/^DATABASE_URL=file:data/gm, '# DATABASE_URL=file:data');
  }
  fs.writeFileSync(envPath, env);
  console.log(`✅ .env DATABASE_URL diupdate ke ${mode === 'local' ? 'file:' : 'postgresql:'}`);
}

// 3. Swap drizzle.config.ts
let drizzleConfig = fs.readFileSync(drizzleConfigPath, 'utf8');
if (mode === 'local') {
  drizzleConfig = drizzleConfig.replace(/dialect:\s*['"]postgresql['"]/, 'dialect: "sqlite"');
} else {
  drizzleConfig = drizzleConfig.replace(/dialect:\s*['"]sqlite['"]/, 'dialect: "postgresql"');
}
fs.writeFileSync(drizzleConfigPath, drizzleConfig);
console.log(`✅ drizzle.config.ts diupdate (dialect: ${mode === 'local' ? 'sqlite' : 'postgresql'})`);

// 4. Swap dialect-specific imports di src (pg-core <-> sqlite-core), KECUALI template schema
const fromDialect = mode === 'local' ? 'drizzle-orm/pg-core' : 'drizzle-orm/sqlite-core';
const toDialect = mode === 'local' ? 'drizzle-orm/sqlite-core' : 'drizzle-orm/pg-core';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Skip template schema files
      if (full.endsWith('schema' + path.sep + 'sqlite.ts') || full.endsWith('schema' + path.sep + 'pg.ts')) continue;
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes(fromDialect)) {
        content = content.split(fromDialect).join(toDialect);
        fs.writeFileSync(full, content);
        console.log(`   ↪ ${path.relative(root, full)}: ${fromDialect} -> ${toDialect}`);
      }
    }
  }
}
walk(path.join(root, 'src'));

console.log(`🎉 Berhasil! Jalankan 'npm run db:push' dan 'npm run db:seed' jika ini pertama kali.`);
