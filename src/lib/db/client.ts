import { Pool, type PoolConfig, type QueryResultRow } from "pg";

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    slot_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    placement TEXT NOT NULL,
    color_preference TEXT NOT NULL,
    status TEXT NOT NULL,
    confirm_pack_pull BOOLEAN NOT NULL DEFAULT TRUE,
    confirm_artist_approval BOOLEAN NOT NULL DEFAULT TRUE,
    confirm_age_and_id BOOLEAN NOT NULL DEFAULT TRUE,
    ai_summary TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS slot_holds (
    slot_id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
  )`,
  `INSERT INTO app_settings (key, value)
   VALUES ('second_day_open', 'false'::jsonb)
   ON CONFLICT (key) DO NOTHING`,
];

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __pgSchemaReady: Promise<void> | undefined;
}

function getConnectionString(): string | undefined {
  return process.env["DATABASE_URL"]?.trim() || undefined;
}

export function isDatabaseEnabled(): boolean {
  return Boolean(getConnectionString());
}

function buildPoolConfig(connectionString: string): PoolConfig {
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  return {
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  };
}

export function getPool(): Pool {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalThis.__pgPool) {
    globalThis.__pgPool = new Pool(buildPoolConfig(connectionString));
  }

  return globalThis.__pgPool;
}

export async function ensureSchema(): Promise<void> {
  if (!isDatabaseEnabled()) return;

  if (!globalThis.__pgSchemaReady) {
    globalThis.__pgSchemaReady = (async () => {
      const pool = getPool();
      for (const statement of SCHEMA_STATEMENTS) {
        await pool.query(statement);
      }
    })().catch((error) => {
      globalThis.__pgSchemaReady = undefined;
      console.error("Failed to initialize database schema:", error);
      throw error;
    });
  }

  await globalThis.__pgSchemaReady;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

export interface DatabaseDiagnostics {
  enabled: boolean;
  connected: boolean;
  bookingCount: number;
  error?: string;
}

export async function getDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
  if (!isDatabaseEnabled()) {
    return {
      enabled: false,
      connected: false,
      bookingCount: 0,
      error: "DATABASE_URL is not set",
    };
  }

  try {
    await ensureSchema();
    const row = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bookings",
    );
    return {
      enabled: true,
      connected: true,
      bookingCount: Number(row?.count ?? 0),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      enabled: true,
      connected: false,
      bookingCount: 0,
      error: message,
    };
  }
}
