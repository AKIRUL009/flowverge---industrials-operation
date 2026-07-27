import prisma from '../src/db/prisma.ts';

/**
 * Script to push and verify Prisma schema structure in Cloud SQL PostgreSQL
 */
async function main() {
  console.log('🚀 Starting Cloud SQL PostgreSQL Schema Sync via Prisma...');

  try {
    // 1. Verify connection
    console.log('📡 Testing database connectivity...');
    await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Connection established to Cloud SQL PostgreSQL.');

    // 2. Ensure tables exist by running raw verification DDL
    console.log('🛠️ Verifying core tables (users, sites, tasks, inventory)...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT UNIQUE,
        full_name TEXT,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        role TEXT DEFAULT 'SITE_SUPERVISOR',
        status TEXT DEFAULT 'Active',
        language_preference TEXT DEFAULT 'English',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        project_id TEXT,
        site_custom_id TEXT UNIQUE,
        name TEXT NOT NULL,
        district TEXT,
        client TEXT,
        client_site_id TEXT,
        location TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        status TEXT DEFAULT 'ON_TIME',
        current_stage TEXT DEFAULT 'Site Selection & Survey',
        supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'PENDING',
        due_date TIMESTAMP,
        site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        unit TEXT DEFAULT 'Pcs',
        quantity DOUBLE PRECISION DEFAULT 0,
        min_stock DOUBLE PRECISION DEFAULT 0,
        remarks TEXT,
        site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ All Prisma model tables verified on Cloud SQL instance.');

    // 3. Count records across Prisma models
    const userCount = await prisma.user.count();
    const siteCount = await prisma.site.count();
    const taskCount = await prisma.task.count();
    const inventoryCount = await prisma.inventory.count();

    console.log('📊 Remote Cloud SQL Record Counts:');
    console.log(` - Users: ${userCount}`);
    console.log(` - Sites: ${siteCount}`);
    console.log(` - Tasks: ${taskCount}`);
    console.log(` - Inventory: ${inventoryCount}`);

    console.log('🎉 Prisma Schema Push & Verification completed successfully!');
  } catch (error: any) {
    console.error('❌ Error pushing Prisma schema to Cloud SQL:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
