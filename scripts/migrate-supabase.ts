import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'zr1AY3AP9bRXSDW1';
  const projectRef = 'lcykwnpwrcapunclkfoi';

  // Try candidate connection strings
  const connectionCandidates = [
    process.env.DATABASE_URL,
    `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  ].filter(Boolean) as string[];

  const schemaSqlPath = path.resolve(process.cwd(), 'database', 'schema.sql');
  if (!fs.existsSync(schemaSqlPath)) {
    console.error('❌ File schema.sql tidak ditemukan di', schemaSqlPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');

  console.log('🚀 Memulai migrasi pembuatan tabel ke Supabase...');

  let client: pg.Client | null = null;
  let connectedUrl = '';

  for (const connectionString of connectionCandidates) {
    try {
      console.log(`🔌 Memencoba koneksi ke Supabase database...`);
      const testClient = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await testClient.connect();
      client = testClient;
      connectedUrl = connectionString;
      console.log('✅ Koneksi ke Supabase PostgreSQL berhasil terhubung!');
      break;
    } catch (err: any) {
      console.warn(`⚠️ Gagal koneksi dengan URL (${connectionString.split('@')[1] || 'host'}):`, err?.message);
    }
  }

  if (!client) {
    console.error('❌ Seluruh percobaan koneksi ke Supabase database gagal.');
    process.exit(1);
  }

  try {
    console.log('📄 Mengeksekusi DDL schema.sql untuk membuat 12 tabel...');
    await client.query(sqlContent);
    console.log('🎉 SELAMAT! Seluruh 12 tabel project TERANG telah berhasil dibuat di Supabase!');

    // Verifikasi daftar tabel di Supabase database
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📋 Daftar Tabel Publik yang Tersedia di Supabase:');
    res.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.table_name}`);
    });

  } catch (err: any) {
    console.error('❌ Gagal mengeksekusi DDL schema:', err);
  } finally {
    await client.end();
  }
}

runMigration();
