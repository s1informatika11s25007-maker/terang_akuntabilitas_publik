import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { db, DEMO_USERS } from '../src/server/db.js';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'zr1AY3AP9bRXSDW1';
  const projectRef = 'lcykwnpwrcapunclkfoi';

  const connectionCandidates = [
    process.env.DATABASE_URL,
    `postgresql://postgres.lcykwnpwrcapunclkfoi:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.lcykwnpwrcapunclkfoi:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:6543/postgres`,
    `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  ].filter(Boolean) as string[];

  const schemaSqlPath = path.resolve(process.cwd(), 'database', 'schema.sql');
  if (!fs.existsSync(schemaSqlPath)) {
    console.error('❌ File schema.sql tidak ditemukan di', schemaSqlPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');

  console.log('🚀 Memulai migrasi DDL & seeding data ke Supabase...');

  let client: pg.Client | null = null;

  for (const connectionString of connectionCandidates) {
    try {
      console.log(`🔌 Mencoba koneksi ke Supabase database...`);
      const testClient = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await testClient.connect();
      client = testClient;
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
    console.log('📄 Mengeksekusi DDL schema.sql...');
    await client.query(sqlContent);

    // Pastikan seluruh kolom opsional tersedia di tabel Supabase
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'aktif';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS verified_by VARCHAR;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_urgensi INT DEFAULT 1;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_ringkasan TEXT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_dupe_of VARCHAR;
    `);

    console.log('🎉 Tabel schema berhasil disinkronkan!');

    // 1. Seed REGIONS (Bulk Batch)
    console.log(`📌 Memasukkan ${db.regions.length} data Wilayah (Regions)...`);
    for (let i = 0; i < db.regions.length; i += 50) {
      const chunk = db.regions.slice(i, i + 50);
      const tuples: string[] = [];
      const vals: any[] = [];
      chunk.forEach((r, idx) => {
        const offset = idx * 9;
        tuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`);
        vals.push(r.id, r.nama, r.tipe, r.kode_bps, r.geojson_key, r.populasi, r.lat, r.lng, r.ibu_kota);
      });
      await client.query(
        `INSERT INTO regions (id, nama, tipe, kode_bps, geojson_key, populasi, lat, lng, ibu_kota)
         VALUES ${tuples.join(', ')}
         ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, populasi = EXCLUDED.populasi`,
        vals
      );
    }

    // 2. Seed SECTORS (Bulk Batch)
    console.log(`📌 Memasukkan ${db.sectors.length} data Sektor (Sectors)...`);
    for (let i = 0; i < db.sectors.length; i += 50) {
      const chunk = db.sectors.slice(i, i + 50);
      const tuples: string[] = [];
      const vals: any[] = [];
      chunk.forEach((s, idx) => {
        const offset = idx * 5;
        tuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        vals.push(s.id, s.nama, s.ikon, s.warna, s.deskripsi);
      });
      await client.query(
        `INSERT INTO sectors (id, nama, ikon, warna, deskripsi)
         VALUES ${tuples.join(', ')}
         ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama`,
        vals
      );
    }

    // 3. Seed BUDGETS (Bulk Batch 200)
    console.log(`📌 Memasukkan ${db.budgets.length} data APBD & Realisasi (Budgets)...`);
    const batchSize = 200;
    for (let i = 0; i < db.budgets.length; i += batchSize) {
      const chunk = db.budgets.slice(i, i + batchSize);
      const tuples: string[] = [];
      const vals: any[] = [];
      chunk.forEach((b, idx) => {
        const offset = idx * 8;
        tuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);
        vals.push(b.id, b.region_id, b.sector_id, b.tahun, b.pagu, b.realisasi, b.serapan_persen, b.sumber);
      });
      await client.query(
        `INSERT INTO budgets (id, region_id, sector_id, tahun, pagu, realisasi, serapan_persen, sumber)
         VALUES ${tuples.join(', ')}
         ON CONFLICT (id) DO UPDATE SET pagu = EXCLUDED.pagu, realisasi = EXCLUDED.realisasi`,
        vals
      );
    }

    // 4. Seed PROJECTS (Bulk Batch 100)
    console.log(`📌 Memasukkan ${db.projects.length} data Katalog Proyek Publik (Projects)...`);
    function toISODate(d: any): string | null {
      if (!d) return null;
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return null;
      return parsed.toISOString().slice(0, 10);
    }

    for (let i = 0; i < db.projects.length; i += 100) {
      const chunk = db.projects.slice(i, i + 100);
      const tuples: string[] = [];
      const vals: any[] = [];
      chunk.forEach((p, idx) => {
        const offset = idx * 18;
        tuples.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18})`);
        vals.push(p.id, p.region_id, p.sector_id, p.kode, p.nama, p.deskripsi, p.lokasi_nama, p.lat, p.lng, p.pagu, p.realisasi, p.progres_fisik, p.status, p.kontraktor, p.tahun, toISODate(p.tgl_mulai), toISODate(p.tgl_target), p.sumber_data);
      });
      await client.query(
        `INSERT INTO projects (id, region_id, sector_id, kode, nama, deskripsi, lokasi_nama, lat, lng, pagu, realisasi, progres_fisik, status, kontraktor, tahun, tgl_mulai, tgl_target, sumber_data)
         VALUES ${tuples.join(', ')}
         ON CONFLICT (id) DO UPDATE SET pagu = EXCLUDED.pagu, realisasi = EXCLUDED.realisasi`,
        vals
      );
    }

    // 5. Seed USERS (Bulk Batch)
    console.log(`📌 Memasukkan Demo Users...`);
    for (const [email, u] of Object.entries(DEMO_USERS)) {
      await client.query(
        `INSERT INTO users (id, email, name, role, region_id, status)
         VALUES ($1, $2, $3, $4, $5, 'aktif')
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
        [`usr-${email.split('@')[0]}`, u.email, u.name, u.role, u.region_id || null]
      );
    }

    // 6. Seed REPORTS & Related Tables
    await client.query(`DELETE FROM agency_responses;`);
    await client.query(`DELETE FROM report_supports;`);
    await client.query(`DELETE FROM report_updates;`);
    await client.query(`DELETE FROM report_photos;`);
    await client.query(`DELETE FROM reports;`);

    const seenTracking = new Set<string>();
    const seenIds = new Set<string>();
    const reportsToInsert = db.reports.map((r, idx) => {
      let tc = r.tracking_code;
      if (seenTracking.has(tc)) {
        const charPool = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let suffix = 1;
        while (seenTracking.has(tc)) {
          const c1 = charPool[(idx + suffix * 3) % charPool.length];
          const c2 = charPool[(idx * 7 + suffix * 5) % charPool.length];
          tc = `TRG-2026-X${c1}${c2}${suffix}`;
          suffix++;
        }
      }
      seenTracking.add(tc);

      let id = r.id;
      if (seenIds.has(id)) {
        id = `${id}-${idx}`;
      }
      seenIds.add(id);

      return { ...r, id, tracking_code: tc };
    });

    console.log(`📌 Memasukkan ${reportsToInsert.length} data Aduan Warga (Reports)...`);

    for (const r of reportsToInsert) {
      await client.query(
        `INSERT INTO reports (id, tracking_code, project_id, region_id, sector_id, kategori, judul, deskripsi, lat, lng, alamat, nama_pelapor, kontak, is_anonim, status, alasan_tolak, dukungan_count, verified_by, verified_at, completed_at, ai_urgensi, ai_ringkasan, ai_dupe_of, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          r.id, r.tracking_code, r.project_id || null, r.region_id, r.sector_id, r.kategori,
          r.judul, r.deskripsi, r.lat, r.lng, r.alamat, r.nama_pelapor, r.kontak, r.is_anonim,
          r.status, r.alasan_tolak || null, r.dukungan_count, r.verified_by || null,
          r.verified_at ? new Date(r.verified_at) : null,
          r.completed_at ? new Date(r.completed_at) : null,
          r.ai_urgensi || 3, r.ai_ringkasan || '', r.ai_dupe_of || null,
          r.created_at ? new Date(r.created_at) : new Date()
        ]
      );

      // Seed Updates
      if (r.updates && r.updates.length > 0) {
        for (const upd of r.updates) {
          await client.query(
            `INSERT INTO report_updates (id, report_id, status_dari, status_ke, catatan, petugas, is_public, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [upd.id, r.id, upd.status_dari || null, upd.status_ke, upd.catatan, upd.petugas, upd.is_public !== false, upd.created_at ? new Date(upd.created_at) : new Date()]
          );
        }
      }

      // Seed Agency Responses
      if (r.agency_response) {
        const ar = r.agency_response;
        await client.query(
          `INSERT INTO agency_responses (id, report_id, instansi, pejabat, tanggapan, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [ar.id, r.id, ar.instansi, ar.pejabat, ar.tanggapan, ar.created_at ? new Date(ar.created_at) : new Date()]
        );
      }
    }

    // 7. Seed ACTIVITY LOGS
    console.log(`📌 Memasukkan ${db.activityLogs.length} Log Aktivitas Sistem (Activity Logs)...`);
    await client.query(`DELETE FROM activity_logs;`);
    for (const act of db.activityLogs) {
      await client.query(
        `INSERT INTO activity_logs (id, user_email, role, aksi, subjek, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [act.id, act.user_email, act.role, act.aksi, act.subjek, act.created_at ? new Date(act.created_at) : new Date()]
      );
    }

    // Ringkasan Jumlah Baris per Tabel
    const countRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📊 Ringkasan Data yang Berhasil Dimigrasikan ke Supabase PostgreSQL:');
    for (const row of countRes.rows) {
      const cnt = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`  • ${row.table_name.padEnd(22)}: ${cnt.rows[0].count} baris`);
    }

    console.log('\n🎉 SELAMAT! Seluruh 1.400+ baris data TERANG berhasil dimasukkan 100% ke Supabase!');

  } catch (err: any) {
    console.error('❌ Gagal mengeksekusi migrasi & seeding Supabase:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
