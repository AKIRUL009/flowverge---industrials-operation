import { pool, db } from '../db/index.ts';
import * as schema from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

/**
 * Cloud SQL PostgreSQL Service Utility
 * Handles connection checks, raw SQL execution via `pg` Pool, and Drizzle ORM operations.
 */

export interface DbStatus {
  connected: boolean;
  database: string;
  host: string;
  timestamp?: string;
  error?: string;
}

/**
 * Verify Cloud SQL PostgreSQL Connection Health
 */
export async function checkCloudSqlConnection(): Promise<DbStatus> {
  const host = process.env.SQL_HOST || 'Not Configured';
  const database = process.env.SQL_DB_NAME || 'Not Configured';

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
      return {
        connected: true,
        database: res.rows[0]?.db_name || database,
        host,
        timestamp: res.rows[0]?.current_time,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Cloud SQL Connection Error]:', err.message);
    return {
      connected: false,
      database,
      host,
      error: err.message,
    };
  }
}

/**
 * Execute a raw parameterized SQL query using the `pg` client pool
 */
export async function executeRawQuery<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(queryText, params);
    return result.rows as T[];
  } catch (error: any) {
    console.error(`[SQL Execution Error] Query: "${queryText}"`, error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Execute operations within a PostgreSQL database transaction
 */
export async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Transaction Failed - Rolled back]:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Export Drizzle ORM Instance & Schemas for typed entity queries
 */
export const dbClient = db;
export const dbSchema = schema;

/**
 * Utility Service Methods for Core Application Entities
 */
export const dbService = {
  checkHealth: checkCloudSqlConnection,
  query: executeRawQuery,
  transaction: executeTransaction,
  db,
  schema,

  // Users Service
  users: {
    getAll: () => db.select().from(schema.users),
    getById: (id: number) => db.select().from(schema.users).where(eq(schema.users.id, id)),
    getByEmail: (email: string) => db.select().from(schema.users).where(eq(schema.users.email, email)),
  },

  // Sites Service
  sites: {
    getAll: () => db.select().from(schema.sites),
    getById: (id: number) => db.select().from(schema.sites).where(eq(schema.sites.id, id)),
  },

  // Stages Service
  stages: {
    getAll: () => db.select().from(schema.stages),
  },

  // Tasks Service
  tasks: {
    getAll: () => db.select().from(schema.tasks),
    getBySiteId: (siteId: number) => db.select().from(schema.tasks).where(eq(schema.tasks.siteId, siteId)),
  },

  // System Settings Service
  settings: {
    getAll: () => db.select().from(schema.systemSettings),
    getByKey: (key: string) => db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, key)),
  },
};

export default dbService;
