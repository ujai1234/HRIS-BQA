import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database operations will fail.');
}

let client: any;
try {
  const sqlHost = process.env.SQL_HOST;
  const sqlUser = process.env.SQL_USER || 'ai_studio_app_user';
  const sqlPass = process.env.SQL_PASSWORD;
  const sqlDb = 'cloud_sql_development_database';

  if (sqlHost && sqlPass) {
    console.log('Connecting to Cloud SQL via Unix socket...');
    client = postgres({
      host: sqlHost,
      user: sqlUser,
      password: sqlPass,
      database: sqlDb,
    });
  } else if (connectionString && (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://'))) {
    console.log('Connecting via DATABASE_URL...');
    client = postgres(connectionString);
  } else {
    console.error('No valid database configuration found. Using mock client.');
    client = postgres('postgres://localhost:5432/placeholder');
  }
} catch (e) {
  console.error('Failed to initialize database client:', e);
  client = postgres('postgres://localhost:5432/placeholder');
}

export const db = drizzle(client, { schema });
